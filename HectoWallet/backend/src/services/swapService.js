import { publicClient } from '../chain/publicClient.js'
import { getWalletClient, getOperatorAccount } from '../chain/walletClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import {
  SWAP_ROUTER_02, QUOTER_V2, POOL_FEE, HUB_SYMBOL,
  SWAP_ROUTER_ABI, QUOTER_V2_ABI, encodePath, buildRoute,
} from '../chain/uniswap.js'
import { getTokenAddress } from '../config.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log, logError } from '../lib/logger.js'

// Uniswap quotes already price in the pool fee, so the only extra guard the
// swap needs is slippage — how far below the quote we still accept.
const SLIPPAGE_BPS = 50n // 0.50%
const MAX_UINT256 = 2n ** 256n - 1n

function resolveAddresses(fromSymbol, toSymbol) {
  if (!PEGGED_SYMBOLS.includes(fromSymbol)) throw new Error(`알 수 없는 코인: ${fromSymbol}`)
  if (!PEGGED_SYMBOLS.includes(toSymbol)) throw new Error(`알 수 없는 코인: ${toSymbol}`)
  if (fromSymbol === toSymbol) throw new Error('같은 코인끼리는 스왑할 수 없습니다')

  const from = getTokenAddress(fromSymbol)
  const to = getTokenAddress(toSymbol)
  const hub = getTokenAddress(HUB_SYMBOL)
  if (!from) throw new Error(`TOKEN_ADDRESS_${fromSymbol}가 설정되지 않았습니다`)
  if (!to) throw new Error(`TOKEN_ADDRESS_${toSymbol}가 설정되지 않았습니다`)
  if (!hub) throw new Error(`TOKEN_ADDRESS_${HUB_SYMBOL}가 설정되지 않았습니다`)

  const route = buildRoute(from, to, hub)
  const path = encodePath(route, Array(route.length - 1).fill(POOL_FEE))
  return { from, to, route, path }
}

async function toBaseUnits(tokenAddress, amount) {
  const decimals = await publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' })
  return { wei: BigInt(amount) * 10n ** BigInt(decimals), decimals }
}

export async function quoteSwapOnChain({ fromSymbol, toSymbol, fromAmount }) {
  const { from, to, path } = resolveAddresses(fromSymbol, toSymbol)
  const { wei: amountInWei } = await toBaseUnits(from, fromAmount)

  // quoteExactInput is nonpayable by ABI but never actually written to chain —
  // simulate it to read the return value without sending a transaction.
  const { result } = await publicClient.simulateContract({
    address: QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: 'quoteExactInput',
    args: [path, amountInWei],
  })
  const [amountOutWei] = result
  const toDecimals = await publicClient.readContract({ address: to, abi: ERC20_ABI, functionName: 'decimals' })

  return {
    amountOutWei,
    toAmount: Number(amountOutWei / 10n ** BigInt(toDecimals)),
    amountInWei,
  }
}

export async function executeSwap({ fromSymbol, toSymbol, fromAmount }) {
  if (!fromAmount || fromAmount <= 0) throw new Error('수량이 유효하지 않습니다')

  const walletClient = getWalletClient()
  const account = getOperatorAccount()
  if (!walletClient || !account) throw new Error('OPERATOR_PRIVATE_KEY가 설정되지 않아 스왑을 실행할 수 없습니다')

  const { from, to, route, path } = resolveAddresses(fromSymbol, toSymbol)
  const { wei: amountInWei } = await toBaseUnits(from, fromAmount)

  const balance = await publicClient.readContract({
    address: from, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address],
  })
  if (balance < amountInWei) throw new Error(`${fromSymbol} 잔액이 부족합니다`)

  const { amountOutWei, toAmount } = await quoteSwapOnChain({ fromSymbol, toSymbol, fromAmount })
  const amountOutMinimum = (amountOutWei * (10_000n - SLIPPAGE_BPS)) / 10_000n

  const allowance = await publicClient.readContract({
    address: from, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, SWAP_ROUTER_02],
  })
  if (allowance < amountInWei) {
    log('swap', `Approving ${fromSymbol} for router`, { spender: SWAP_ROUTER_02 })
    const approveHash = await walletClient.writeContract({
      address: from, abi: ERC20_ABI, functionName: 'approve', args: [SWAP_ROUTER_02, MAX_UINT256],
    })
    await publicClient.waitForTransactionReceipt({ hash: approveHash, timeout: 120_000 })
    log('swap', 'Approve confirmed', { approveHash })
  }

  log('swap', 'Executing Uniswap V3 swap', { fromSymbol, toSymbol, fromAmount, hops: route.length - 1 })
  const txHash = await walletClient.writeContract({
    address: SWAP_ROUTER_02,
    abi: SWAP_ROUTER_ABI,
    functionName: 'exactInput',
    args: [{ path, recipient: account.address, amountIn: amountInWei, amountOutMinimum }],
  })

  log('swap', 'Swap tx submitted', { txHash })
  return {
    txHash,
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount,
    hops: route.length - 1,
    status: 'submitted',
    explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
  }
}

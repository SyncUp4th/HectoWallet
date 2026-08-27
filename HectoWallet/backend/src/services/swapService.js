import { publicClient } from '../chain/publicClient.js'
import { getWalletClient, getOperatorAccount, getWalletClientFor, getAccount } from '../chain/walletClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import {
  SWAP_ROUTER_02, QUOTER_V2, POOL_FEE, HUB_SYMBOL,
  SWAP_ROUTER_ABI, QUOTER_V2_ABI, encodePath, buildRoute, feeRateForHops,
} from '../chain/uniswap.js'
import { getTokenAddress } from '../config.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log, logError } from '../lib/logger.js'

// Uniswap quotes already price in the pool fee, so the only extra guard the
// swap needs is slippage — how far below the quote we still accept.
const SLIPPAGE_BPS = 50n // 0.50%
const MAX_UINT256 = 2n ** 256n - 1n

// Vercel's serverless function timeout (10s on the Hobby plan) sits close to
// what a purchase's two sequential on-chain transfers can take: nonce, gas
// estimate, and fee-history lookups add ~2.5s of preflight PER writeContract
// call on top of the balance reads. Passing a fixed gas limit skips
// eth_estimateGas entirely — measured usage is ~52k for an ERC20 transfer and
// ~204k for a 2-hop swap, so these leave real margin without over-paying gas
// (Sepolia ETH is free, and viem still fetches the real fee-per-gas, so this
// only ever risks reverting on genuinely unexpected gas use, never overpaying
// price — just the fixed unit count).
const GAS_APPROVE = 70_000n
const GAS_TRANSFER = 80_000n
const GAS_SWAP = 350_000n

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

// An ERC20's decimals can never change, so one read per token per process is
// enough — without this a single purchase burns a dozen calls and trips the
// RPC provider's rate limit.
const _decimalsCache = new Map()
export async function tokenDecimals(tokenAddress) {
  const key = tokenAddress.toLowerCase()
  if (!_decimalsCache.has(key)) {
    _decimalsCache.set(key, await publicClient.readContract({
      address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals',
    }))
  }
  return _decimalsCache.get(key)
}

async function toBaseUnits(tokenAddress, amount) {
  const decimals = await tokenDecimals(tokenAddress)
  return { wei: BigInt(amount) * 10n ** BigInt(decimals), decimals }
}

export async function quoteSwapOnChain({ fromSymbol, toSymbol, fromAmount }) {
  const { from, to, route, path } = resolveAddresses(fromSymbol, toSymbol)
  const { wei: amountInWei } = await toBaseUnits(from, fromAmount)
  const hops = route.length - 1

  // quoteExactInput is nonpayable by ABI but never actually written to chain —
  // simulate it to read the return value without sending a transaction.
  const { result } = await publicClient.simulateContract({
    address: QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: 'quoteExactInput',
    args: [path, amountInWei],
  })
  const [amountOutWei] = result
  const toDecimals = await tokenDecimals(to)
  const scale = 10n ** BigInt(toDecimals)

  const toAmount = Number(amountOutWei / scale)
  const amountOutMinimumWei = (amountOutWei * (10_000n - SLIPPAGE_BPS)) / 10_000n

  // Every coin is pegged 1:1, so a fee-free swap would return exactly the
  // input. Whatever the pool withholds beyond the known fee is price impact.
  // Measured against the unrounded output — comparing the floored whole-coin
  // figure would report sub-1-coin truncation as if it were pool slippage.
  const feeRate = feeRateForHops(hops)
  const exactOut = Number(amountOutWei) / Number(scale)
  const expectedAfterFee = Number(fromAmount) * (1 - feeRate)
  const priceImpact = expectedAfterFee > 0
    ? Math.max(0, (expectedAfterFee - exactOut) / expectedAfterFee)
    : 0

  return {
    amountInWei,
    amountOutWei,
    amountOutMinimumWei,
    toAmount,
    minReceived: Number(amountOutMinimumWei / scale),
    feeRate,
    priceImpact,
    hops,
    slippageTolerance: Number(SLIPPAGE_BPS) / 10_000,
  }
}

export async function executeSwap({ fromSymbol, toSymbol, fromAmount }) {
  if (!fromAmount || fromAmount <= 0) throw new Error('수량이 유효하지 않습니다')

  const walletClient = getWalletClient()
  const account = getOperatorAccount()
  if (!walletClient || !account) throw new Error('OPERATOR_PRIVATE_KEY가 설정되지 않아 스왑을 실행할 수 없습니다')

  const { from, to, route, path } = resolveAddresses(fromSymbol, toSymbol)
  const { wei: amountInWei } = await toBaseUnits(from, fromAmount)

  // Balance, allowance, and the pool quote don't depend on each other — only
  // the decisions made from them do — so they run concurrently instead of
  // as three sequential round trips.
  const [balance, allowance, quote] = await Promise.all([
    publicClient.readContract({ address: from, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] }),
    publicClient.readContract({ address: from, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, SWAP_ROUTER_02] }),
    quoteSwapOnChain({ fromSymbol, toSymbol, fromAmount }),
  ])
  if (balance < amountInWei) throw new Error(`${fromSymbol} 잔액이 부족합니다`)
  const amountOutMinimum = quote.amountOutMinimumWei

  if (allowance < amountInWei) {
    log('swap', `Approving ${fromSymbol} for router`, { spender: SWAP_ROUTER_02 })
    const approveHash = await walletClient.writeContract({
      address: from, abi: ERC20_ABI, functionName: 'approve', args: [SWAP_ROUTER_02, MAX_UINT256], gas: GAS_APPROVE,
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
    gas: GAS_SWAP,
  })

  log('swap', 'Swap tx submitted', { txHash })
  return {
    txHash,
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount: quote.toAmount,
    minReceived: quote.minReceived,
    feeRate: quote.feeRate,
    priceImpact: quote.priceImpact,
    hops: quote.hops,
    status: 'submitted',
    explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
  }
}

// Plain ERC20 transfer, signed by whichever wallet is sending. The store uses
// both directions: the operator pays the purchase, the merchant pays the
// reward back, so a demo purchase settles as two real on-chain transfers.
const KEY_ENV = { operator: 'OPERATOR_PRIVATE_KEY', merchant: 'MERCHANT_PRIVATE_KEY' }

export async function transferToken({ symbol, to, amount, from = 'operator' }) {
  if (!amount || amount <= 0) throw new Error('수량이 유효하지 않습니다')

  const walletClient = getWalletClientFor(from)
  const account = getAccount(from)
  if (!walletClient || !account) throw new Error(`${KEY_ENV[from]}가 설정되지 않아 전송할 수 없습니다`)

  const tokenAddress = getTokenAddress(symbol)
  if (!tokenAddress) throw new Error(`TOKEN_ADDRESS_${symbol}가 설정되지 않았습니다`)

  const { wei } = await toBaseUnits(tokenAddress, amount)

  // Balance and gas are independent reads — check both at once instead of
  // paying for two round trips back to back.
  const [balance, gasBalance] = await Promise.all([
    publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] }),
    publicClient.getBalance({ address: account.address }),
  ])
  if (balance < wei) throw new Error(`${from} 지갑의 ${symbol} 잔액이 부족합니다`)
  // A funded token balance is not enough — the sender pays its own gas, and
  // the merchant wallet is easy to leave without any ETH at all.
  if (gasBalance === 0n) throw new Error(`${from} 지갑에 가스비(Sepolia ETH)가 없습니다`)

  log('transfer', `Transferring ${symbol}`, { from, to, amount })
  const txHash = await walletClient.writeContract({
    address: tokenAddress, abi: ERC20_ABI, functionName: 'transfer', args: [to, wei], gas: GAS_TRANSFER,
  })

  log('transfer', 'Transfer tx submitted', { txHash })
  return { txHash, symbol, from: account.address, to, amount, explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}` }
}

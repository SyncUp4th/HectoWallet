import { publicClient } from '../chain/publicClient.js'
import { getWalletClient, getTreasuryAccount } from '../chain/walletClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { getTokenAddress, getSwapContractConfig } from '../config.js'
import { computeSwapQuote } from '../lib/swapMath.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log, logError } from '../lib/logger.js'

const SEPOLIA_CHAIN_ID = 11155111

// Try to auto-fetch ABI from Etherscan if swapAbi.json is still empty and
// the contract is Etherscan-verified. Cached in memory per process lifetime.
let _cachedSwapAbi = null
async function resolveSwapAbi(contractAddress, fallbackAbi) {
  if (fallbackAbi.length > 0) return fallbackAbi
  if (_cachedSwapAbi) return _cachedSwapAbi

  const apiKey = process.env.ETHERSCAN_API_KEY
  if (!apiKey) return []

  try {
    const url = `https://api.etherscan.io/v2/api?chainid=${SEPOLIA_CHAIN_ID}&module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`
    const res = await fetch(url)
    const json = await res.json()
    if (json.status === '1') {
      _cachedSwapAbi = JSON.parse(json.result)
      log('etherscan', 'Fetched swap contract ABI', { functions: _cachedSwapAbi.filter((x) => x.type === 'function').map((x) => x.name) })
      return _cachedSwapAbi
    }
    log('etherscan', 'Swap contract ABI not available', { message: json.message })
  } catch (err) {
    logError('etherscan', 'Failed to fetch swap ABI', err)
  }
  return []
}

export async function executeSwap({ fromSymbol, toSymbol, fromAmount }) {
  if (!PEGGED_SYMBOLS.includes(fromSymbol)) throw new Error(`알 수 없는 fromSymbol: ${fromSymbol}`)
  if (!PEGGED_SYMBOLS.includes(toSymbol)) throw new Error(`알 수 없는 toSymbol: ${toSymbol}`)
  if (fromSymbol === toSymbol) throw new Error('같은 코인끼리 스왑할 수 없습니다')
  if (!fromAmount || fromAmount <= 0) throw new Error('수량이 유효하지 않습니다')

  const walletClient = getWalletClient()
  if (!walletClient) throw new Error('TREASURY_PRIVATE_KEY 또는 TREASURY_MNEMONIC이 .env에 설정되지 않았습니다')

  const account = getTreasuryAccount()
  const { address: swapContract, abi: rawAbi, configured } = getSwapContractConfig()
  if (!swapContract) throw new Error('SWAP_CONTRACT_ADDRESS가 .env에 설정되지 않았습니다')

  const fromAddress = getTokenAddress(fromSymbol)
  const toAddress = getTokenAddress(toSymbol)
  if (!fromAddress) throw new Error(`TOKEN_ADDRESS_${fromSymbol}가 .env에 설정되지 않았습니다`)
  if (!toAddress) throw new Error(`TOKEN_ADDRESS_${toSymbol}가 .env에 설정되지 않았습니다`)

  // Resolve ABI — file first, then Etherscan auto-fetch
  const swapAbi = await resolveSwapAbi(swapContract, rawAbi)
  if (swapAbi.length === 0) {
    throw new Error('스왑 컨트랙트 ABI를 찾을 수 없습니다. src/chain/swapAbi.json에 ABI를 직접 입력하거나, Etherscan에서 컨트랙트를 Verify해 주세요.')
  }

  // Get decimals for the from-token to build the wei amount
  const fromDecimals = await publicClient.readContract({
    address: fromAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  const fromAmountWei = BigInt(fromAmount) * 10n ** BigInt(fromDecimals)

  // Ensure swap contract has ERC20 allowance to pull fromToken from treasury
  const allowance = await publicClient.readContract({
    address: fromAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account.address, swapContract],
  })

  if (allowance < fromAmountWei) {
    log('swap', `Approving ${fromSymbol} spend`, { spender: swapContract, amount: fromAmountWei.toString() })
    const approveTxHash = await walletClient.writeContract({
      address: fromAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [swapContract, fromAmountWei],
    })
    // Wait for approve to confirm before the swap call
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash, timeout: 60_000 })
    log('swap', 'Approve confirmed', { approveTxHash })
  }

  // Compute expected output using the same fee math as the frontend
  const quote = computeSwapQuote(fromAmount)

  log('swap', 'Executing swap', { fromSymbol, toSymbol, fromAmount, fromAddress, toAddress })
  // Fire the swap — return tx hash immediately so the HTTP response doesn't
  // time out while waiting for a block. The frontend links to Etherscan to track.
  // ponytail: fire-and-forget pattern; add waitForTransactionReceipt + push
  //   notification if you need confirmed-status feedback in the UI.
  const txHash = await walletClient.writeContract({
    address: swapContract,
    abi: swapAbi,
    functionName: 'swap',
    args: [fromAddress, toAddress, fromAmountWei],
  })

  log('swap', 'Swap tx submitted', { txHash })
  return {
    txHash,
    fromSymbol,
    toSymbol,
    fromAmount,
    toAmount: quote.toAmount,
    status: 'submitted',
    explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
  }
}

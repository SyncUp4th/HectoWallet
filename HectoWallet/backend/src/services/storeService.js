import { executeSwap, transferToken, tokenDecimals } from './swapService.js'
import { publicClient } from '../chain/publicClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { getTokenAddress, getOperatorAddress } from '../config.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log } from '../lib/logger.js'

const STORE_CURRENCY = 'HHPC'

// Where a purchase's coins go. Deliberately has NO default: a purchase moves
// real tokens irreversibly, so an unset address must block the purchase rather
// than pick a destination on the operator's behalf.
function merchantAddress() {
  return process.env.STORE_MERCHANT_ADDRESS || null
}

// Store is mock-only, same as settlement. Desimone (드시모네) is priced in
// HHPC since it's a Hecto Healthcare-affiliated brand for this demo.
const PRODUCTS = [
  { id: 'dsm-01', name: '드시모네 오리지널 유산균', description: '이탈리아 정통 유산균 De Simone Formulation', priceHhpc: 15000 },
  { id: 'dsm-02', name: '드시모네 키즈 유산균', description: '어린이용 저용량 포뮬러', priceHhpc: 18000 },
  { id: 'dsm-03', name: '드시모네 멀티비타민', description: '유산균과 함께 먹는 종합비타민', priceHhpc: 12000 },
  { id: 'dsm-04', name: '드시모네 콜라겐 스틱', description: '저분자 콜라겐 + 유산균 스틱', priceHhpc: 22000 },
]

export function getStoreProducts() {
  return {
    brand: '드시모네',
    currency: STORE_CURRENCY,
    merchantAddress: merchantAddress(),
    products: PRODUCTS,
  }
}

async function balanceOf(symbol, holder) {
  const address = getTokenAddress(symbol)
  if (!address) return 0
  const [raw, decimals] = await Promise.all([
    publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'balanceOf', args: [holder] }),
    tokenDecimals(address),
  ])
  return Number(raw / 10n ** BigInt(decimals))
}

// A purchase settles as a real transfer of the price out of the operator
// wallet. If HHPC alone can't cover it, the shortfall is swapped in first
// from whichever held coin can fund it, then the transfer goes out.
export async function purchaseProduct(productId) {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) throw new Error('상품을 찾을 수 없습니다')

  const operator = getOperatorAddress()
  if (!operator) throw new Error('운영 지갑이 설정되지 않았습니다')

  const merchant = merchantAddress()
  if (!merchant) throw new Error('판매자 주소(STORE_MERCHANT_ADDRESS)가 설정되지 않아 결제를 진행할 수 없습니다')

  const held = await balanceOf(STORE_CURRENCY, operator)
  let swap = null

  if (held < product.priceHhpc) {
    const shortfall = product.priceHhpc - held
    // Overshoot by the worst-case fee+slippage so the swap can't land just
    // short of the price and fail the transfer that follows it.
    const needed = Math.ceil(shortfall * 1.01)

    const candidates = await Promise.all(
      PEGGED_SYMBOLS.filter((s) => s !== STORE_CURRENCY).map(async (symbol) => ({
        symbol,
        balance: await balanceOf(symbol, operator),
      })),
    )
    const donor = candidates.find((c) => c.balance >= needed)
    if (!donor) throw new Error(`보유 자산이 부족해 구매할 수 없습니다 (${shortfall.toLocaleString()} ${STORE_CURRENCY} 부족)`)

    log('store', 'Auto-swapping to cover purchase', { productId, donor: donor.symbol, needed })
    swap = await executeSwap({ fromSymbol: donor.symbol, toSymbol: STORE_CURRENCY, fromAmount: needed })
    await publicClient.waitForTransactionReceipt({ hash: swap.txHash, timeout: 120_000 })
  }

  const transfer = await transferToken({
    symbol: STORE_CURRENCY,
    to: merchant,
    amount: product.priceHhpc,
  })

  return {
    productId: product.id,
    productName: product.name,
    price: product.priceHhpc,
    currency: STORE_CURRENCY,
    merchantAddress: merchant,
    swap,
    txHash: transfer.txHash,
    explorerUrl: transfer.explorerUrl,
    status: 'submitted',
  }
}

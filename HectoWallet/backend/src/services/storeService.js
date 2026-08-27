import { executeSwap, transferToken, tokenDecimals } from './swapService.js'
import { publicClient } from '../chain/publicClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { getTokenAddress, getOperatorAddress } from '../config.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log, logError } from '../lib/logger.js'

const STORE_CURRENCY = 'HHPC'

// Purchase reward, paid by the merchant back to the buyer. Charged on the
// amount actually paid (the sale price), not the struck-through list price.
export const REWARD_RATE = 0.02

export function rewardFor(price) {
  return Math.floor(price * REWARD_RATE)
}

// Where a purchase's coins go. Deliberately has NO default: a purchase moves
// real tokens irreversibly, so an unset address must block the purchase rather
// than pick a destination on the operator's behalf.
function merchantAddress() {
  return process.env.STORE_MERCHANT_ADDRESS || null
}

// Catalog mirrors desimone.co.kr — a subset, not the full 35 SKUs. Prices are
// the real KRW figures used as-is: every coin is pegged 1:1 to KRW, so the
// won price and the HHPC price are the same number.
// ponytail: static list, no real inventory behind it — same status as
// settlement. Swap for the real product API when there is one.
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'promo', label: '프로모션 세트' },
  { id: 'premium', label: '프리미엄 라인' },
  { id: 'basic', label: '베이직 라인' },
]

const PRODUCTS = [
  { id: 'dsm-1200-2box', category: 'promo', name: '드시모네 1200 (60포) 2BOX', tags: ['4개월분', '아연', '비타민D'], listPriceHhpc: 296000, priceHhpc: 192400, rating: 4.9, reviews: 710, image: '/store/dsm-1200-2box.png' },
  { id: 'dsm-2000-2box', category: 'promo', name: '드시모네 2000 2BOX', tags: ['보장균수 2,000억'], listPriceHhpc: 256000, priceHhpc: 179200, rating: 4.8, reviews: 1672, image: '/store/dsm-2000-2box.png' },
  { id: 'dsm-kids-blue-2box', category: 'promo', name: '드시모네 키즈 프리미엄 블루베리향 2BOX', tags: ['키즈 유산균 보장균수 1위'], listPriceHhpc: 196000, priceHhpc: 137200, rating: 4.7, reviews: 351, image: '/store/dsm-kids-blue-2box.png' },
  { id: 'dsm-baby-step1-3box', category: 'promo', name: '드시모네 베이비 스텝1 3BOX', tags: ['모유ㆍ분유 수유 아기'], listPriceHhpc: 114000, priceHhpc: 79800, rating: 4.9, reviews: 1204, image: '/store/dsm-baby-step1-3box.png' },

  { id: 'dsm-4500', category: 'premium', name: '드시모네 4500 (30포)', tags: ['보장균수 4,500억'], listPriceHhpc: 168000, priceHhpc: 142800, rating: 4.9, reviews: 5179, image: '/store/dsm-4500.jpg' },
  { id: 'dsm-2000', category: 'premium', name: '드시모네 2000 (30포)', tags: ['보장균수 2,000억'], priceHhpc: 128000, rating: 4.8, reviews: 1077, image: '/store/dsm-2000.jpg' },
  { id: 'dsm-kids-basic', category: 'premium', name: '드시모네 키즈 프리미엄 기본향 (30포)', tags: ['키즈 유산균 보장균수 1위'], priceHhpc: 98000, rating: 4.8, reviews: 544, image: '/store/dsm-kids-basic.png' },

  { id: 'dsm-caps-plus', category: 'basic', name: '드시모네 캡슐 플러스 (60캡슐)', tags: ['보장균수 1,000억'], priceHhpc: 98000, rating: 4.8, reviews: 157, image: '/store/dsm-caps-plus.png' },
  { id: 'dsm-365-caps', category: 'basic', name: '드시모네 365 캡슐 (30캡슐)', tags: [], priceHhpc: 48000, rating: 4.9, reviews: 790, image: '/store/dsm-365-caps.png' },
  { id: 'dsm-kids-yogurt', category: 'basic', name: '드시모네 키즈 요거트 플레인 (3개입)', tags: [], priceHhpc: 12000, rating: 4.9, reviews: 102, image: '/store/dsm-kids-yogurt.png' },
]

export function getStoreProducts() {
  return {
    brand: '드시모네',
    currency: STORE_CURRENCY,
    rewardRate: REWARD_RATE,
    merchantAddress: merchantAddress(),
    categories: CATEGORIES,
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
  if (product.soldOut) throw new Error('품절된 상품입니다')

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
    from: 'operator',
  })

  // Reward leaves the merchant wallet, so it needs that wallet's own key and
  // gas. The two transfers aren't atomic: the payment has already settled by
  // now, so a failed reward is reported alongside a successful purchase
  // rather than rolling anything back or throwing the purchase away.
  const rewardAmount = rewardFor(product.priceHhpc)
  let reward = null
  if (rewardAmount > 0) {
    try {
      const paid = await transferToken({
        symbol: STORE_CURRENCY,
        to: operator,
        amount: rewardAmount,
        from: 'merchant',
      })
      reward = { ...paid, rate: REWARD_RATE, status: 'submitted' }
      log('store', 'Reward paid', { productId, rewardAmount })
    } catch (err) {
      logError('store', 'reward payout failed; purchase already settled', err)
      reward = { amount: rewardAmount, rate: REWARD_RATE, status: 'failed', error: err.shortMessage ?? err.message }
    }
  }

  return {
    productId: product.id,
    productName: product.name,
    price: product.priceHhpc,
    netPaid: product.priceHhpc - (reward?.status === 'submitted' ? rewardAmount : 0),
    currency: STORE_CURRENCY,
    merchantAddress: merchant,
    swap,
    reward,
    txHash: transfer.txHash,
    explorerUrl: transfer.explorerUrl,
    status: 'submitted',
  }
}

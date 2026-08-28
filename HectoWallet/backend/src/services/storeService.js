import { executeSwap, transferToken, tokenDecimals } from './swapService.js'
import { publicClient } from '../chain/publicClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { getTokenAddress, getOperatorAddress } from '../config.js'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { log, logError } from '../lib/logger.js'

// The store is Desimone's Olive Young brand shop, so it settles in the Olive
// Young point coin rather than the Hecto Healthcare one.
const STORE_CURRENCY = 'OLIVEPC'

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

// Catalog mirrors Desimone's Olive Young brand store — a subset, not all 29
// SKUs. `listPrice`/`price` are the real KRW figures used as-is: every coin is
// pegged 1:1 to KRW, so the won price and the coin price are the same number.
// ponytail: static list, no real inventory behind it — same status as
// settlement. Swap for the real product API when there is one.
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'adult', label: '성인' },
  { id: 'kids', label: '키즈' },
  { id: 'baby', label: '베이비' },
]

const PRODUCTS = [
  { id: 'oy-caps-plus', category: 'adult', name: '드시모네 캡슐플러스 1박스 (60캡슐)', tags: ['보장균수 1,000억', '1개월분'], listPrice: 98000, price: 68600, rating: 5.0, reviews: 23, image: '/store/oy-caps-plus.jpg' },
  { id: 'oy-2000', category: 'adult', name: '드시모네 2000 30포 1박스 (1개월분)', tags: ['보장균수 2,000억'], listPrice: 128000, price: 102400, rating: 4.7, reviews: 27, image: '/store/oy-2000.jpg' },
  { id: 'oy-prime', category: 'adult', name: '드시모네 프라임 60포 1박스 (2개월분)', tags: ['보장균수 1,000억'], listPrice: 120000, price: 96000, rating: 4.9, reviews: 70, image: '/store/oy-prime.jpg' },
  { id: 'oy-365-caps', category: 'adult', name: '드시모네 365 캡슐 30캡슐 (1개월분)', tags: [], listPrice: 40000, price: 32000, rating: 5.0, reviews: 14, image: '/store/oy-365-caps.jpg' },
  { id: 'oy-365-grape', category: 'adult', name: '드시모네 365 포도향 30포 (1개월분)', tags: [], listPrice: 40000, price: 32000, rating: 4.0, reviews: 2, image: '/store/oy-365-grape.jpg' },

  { id: 'oy-kids-blue', category: 'kids', name: '드시모네 키즈 스텝1 블루베리향 30포 1박스', tags: ['보장균수 200억', '3-7세'], listPrice: 78000, price: 62400, rating: 4.9, reviews: 46, image: '/store/oy-kids-blue.jpg' },
  { id: 'oy-kids-apple', category: 'kids', name: '드시모네 키즈 스텝1 사과향 30포 1박스', tags: ['보장균수 200억', '3-7세'], listPrice: 78000, price: 62400, rating: 5.0, reviews: 23, image: '/store/oy-kids-apple.jpg' },
  { id: 'oy-bear-chew', category: 'kids', name: '드시모네 곰돌이 츄어블 플러스 60정 (1박스)', tags: ['씹어먹는 츄어블'], listPrice: 40000, price: 32000, rating: 4.9, reviews: 1129, image: '/store/oy-bear-chew.jpg' },

  { id: 'oy-baby-step1-2box', category: 'baby', name: '드시모네 베이비스텝1 30포 2박스 (2개월분)', tags: ['모유ㆍ분유 수유 아기'], listPrice: 76000, price: 60800, rating: 5.0, reviews: 123, image: '/store/oy-baby-step1-2box.jpg' },
  { id: 'oy-baby-step2', category: 'baby', name: '드시모네 베이비스텝2 30포 1박스 (1개월분)', tags: ['유아식 섭취 아기'], listPrice: 48000, price: 38400, rating: 4.9, reviews: 126, image: '/store/oy-baby-step2.jpg' },
]

export function getStoreProducts() {
  return {
    brand: '드시모네 · OLIVE YOUNG',
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
// wallet. If the store currency alone can't cover it, the shortfall is
// swapped in first from whichever held coin can fund it, then the transfer
// goes out.
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

  if (held < product.price) {
    const shortfall = product.price - held
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
    amount: product.price,
    from: 'operator',
  })

  // Reward leaves the merchant wallet, so it needs that wallet's own key and
  // gas. The two transfers aren't atomic: the payment has already settled by
  // now, so a failed reward is reported alongside a successful purchase
  // rather than rolling anything back or throwing the purchase away.
  const rewardAmount = rewardFor(product.price)
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
    price: product.price,
    netPaid: product.price - (reward?.status === 'submitted' ? rewardAmount : 0),
    currency: STORE_CURRENCY,
    merchantAddress: merchant,
    swap,
    reward,
    txHash: transfer.txHash,
    explorerUrl: transfer.explorerUrl,
    status: 'submitted',
  }
}

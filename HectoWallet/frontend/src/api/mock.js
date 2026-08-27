import { computeSwapQuote } from '../lib/swap.js'
import { PEGGED_COINS } from '../constants/coins.js'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const ASSETS = [
  { symbol: 'USDT', name: '원화 스테이블', balance: 500, address: '0xa1c2...9f3d' },
  { symbol: 'HIPC', name: '헥토이노베이션', balance: 3204, address: '0x2d91...77b4' },
  { symbol: 'HFPC', name: '헥토파이낸셜', balance: 58900, address: '0x51ac...9e20' },
  { symbol: 'HHPC', name: '헥토헬스케어', balance: 9121, address: '0x7f3d...2b6c' },
  { symbol: 'OLIVEPC', name: '올리브영', balance: 4850, address: '0x6ac2...d904' },
]

const PEGGED_SYMBOLS = PEGGED_COINS.map((c) => c.symbol)

export const mockApi = {
  async getAssets() {
    await delay()
    const totalKrw = ASSETS.reduce((sum, a) => sum + a.balance, 0)
    return { totalKrw, coins: ASSETS, walletAddress: '0x097b8174E0D80fF227176EfF1E14BCefc9513B0B' }
  },

  async getRates() {
    await delay()
    return { base: 'KRW', rates: PEGGED_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) }
  },

  async quoteSwap({ fromAmount }) {
    await delay(200)
    return computeSwapQuote(fromAmount)
  },

  async executeSwap({ fromSymbol, toSymbol, fromAmount }) {
    await delay(800)
    const quote = computeSwapQuote(fromAmount)
    const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    return {
      txHash: mockHash,
      fromSymbol,
      toSymbol,
      fromAmount,
      toAmount: quote.toAmount,
      status: 'submitted',
      explorerUrl: `https://sepolia.etherscan.io/tx/${mockHash}`,
    }
  },

  async getTransactions() {
    await delay()
    return {
      stats: { todayCount: 428, volume24h: 43700, activeWallets: 96, lastSyncBlock: 1208455 },
      items: [
        { hash: '0x9a2f...11c4', type: 'swap', hops: 2, fromCompany: '헥토파이낸셜', toCompany: '헥토이노베이션', flow: '1,000 HFPC → 999 HIPC', status: 'success', time: '2분 전' },
        { hash: '0x7b6d...88e2', type: 'transfer', direction: 'out', fromCompany: '헥토헬스케어', toCompany: '0x0000...dEaD', flow: '-15,000 HHPC', status: 'success', time: '6분 전' },
        { hash: '0x1c4a...5f09', type: 'transfer', direction: 'in', fromCompany: '0x6ac2...d904', toCompany: '올리브영', flow: '+2,340 OLIVEPC', status: 'pending', time: '11분 전' },
        { hash: '0x44df...c712', type: 'swap', hops: 1, fromCompany: '헥토헬스케어', toCompany: '원화 스테이블', flow: '3,000 HHPC → 2,999 KRWC', status: 'success', time: '24분 전' },
        { hash: '0xe210...9a3b', type: 'swap', hops: 1, fromCompany: '원화 스테이블', toCompany: '헥토파이낸셜', flow: '1,000 KRWC → 999 HFPC', status: 'failed', time: '41분 전' },
      ],
    }
  },

  async getStoreProducts() {
    await delay()
    return {
      brand: '드시모네',
      currency: 'HHPC',
      rewardRate: 0.02,
      merchantAddress: null,
      categories: [
        { id: 'all', label: '전체' },
        { id: 'promo', label: '프로모션 세트' },
        { id: 'premium', label: '프리미엄 라인' },
        { id: 'basic', label: '베이직 라인' },
      ],
      products: [
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
      ],
    }
  },

  async purchaseProduct(productId) {
    await delay(900)
    const products = (await this.getStoreProducts()).products
    const product = products.find((p) => p.id === productId)
    if (!product) throw new Error('상품을 찾을 수 없습니다')
    const hash = () => '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const payTx = hash()
    const rewardTx = hash()
    const rewardAmount = Math.floor(product.priceHhpc * 0.02)
    return {
      productId: product.id,
      productName: product.name,
      price: product.priceHhpc,
      netPaid: product.priceHhpc - rewardAmount,
      currency: 'HHPC',
      merchantAddress: null,
      swap: null,
      reward: {
        amount: rewardAmount,
        rate: 0.02,
        status: 'submitted',
        txHash: rewardTx,
        explorerUrl: `https://sepolia.etherscan.io/tx/${rewardTx}`,
      },
      txHash: payTx,
      explorerUrl: `https://sepolia.etherscan.io/tx/${payTx}`,
      status: 'submitted',
    }
  },

  async getSettlement() {
    await delay()
    return {
      period: '2026년 8월',
      summary: { txCount: 428, netMoved: 43700, unsettled: 14300 },
      positions: [
        { company: '헥토이노베이션', net: 37200 },
        { company: '헥토파이낸셜', net: -22900 },
        { company: '헥토헬스케어', net: -14300 },
      ],
      ledger: [
        { creditor: '헥토이노베이션', debtor: '헥토파이낸셜', flow: 'HFPC → HIPC', qty: 22900, krw: 22900, status: 'done' },
        { creditor: '헥토이노베이션', debtor: '헥토헬스케어', flow: 'HHPC → HIPC', qty: 14300, krw: 14300, status: 'pending' },
        { creditor: '헥토파이낸셜', debtor: '헥토헬스케어', flow: 'HHPC → HFPC', qty: 6500, krw: 6500, status: 'done' },
      ],
    }
  },
}

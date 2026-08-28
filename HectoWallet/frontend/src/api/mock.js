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
      brand: 'OLIVE YOUNG',
      currency: 'OLIVEPC',
      rewardRate: 0.02,
      merchantAddress: null,
      categories: [
        { id: 'all', label: '전체' },
        { id: 'adult', label: '성인' },
        { id: 'kids', label: '키즈' },
        { id: 'baby', label: '베이비' },
      ],
      products: [
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
    const rewardAmount = Math.floor(product.price * 0.02)
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      netPaid: product.price - rewardAmount,
      currency: 'OLIVEPC',
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

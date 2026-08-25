import { computeSwapQuote } from '../lib/swap.js'
import { PEGGED_COINS } from '../constants/coins.js'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const ASSETS = [
  { symbol: 'USDT', name: '원화 (KRW)', balance: 500, address: '0xa1c2...9f3d' },
  { symbol: 'OLIVEPC', name: '올리브영', balance: 4850, address: '0x6ac2...d904' },
  { symbol: 'HHPC', name: '헥토헬스케어', balance: 9121, address: '0x7f3d...2b6c' },
  { symbol: 'HIPC', name: '헥토이노베이션', balance: 3204, address: '0x2d91...77b4' },
  { symbol: 'HFPC', name: '헥토파이낸셜', balance: 58900, address: '0x51ac...9e20' },
]

const PEGGED_SYMBOLS = PEGGED_COINS.map((c) => c.symbol)

export const mockApi = {
  async getAssets() {
    await delay()
    const totalKrw = ASSETS.reduce((sum, a) => sum + a.balance, 0)
    return { totalKrw, coins: ASSETS }
  },

  async getRates() {
    await delay()
    return { base: 'KRW', rates: PEGGED_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) }
  },

  async quoteSwap({ fromAmount }) {
    await delay(200)
    return computeSwapQuote(fromAmount)
  },

  async getSwapContractConfig() {
    await delay(100)
    return { address: null, abi: [], chainId: 11155111, configured: false }
  },

  async getTransactions() {
    await delay()
    return {
      stats: { todayCount: 428, volume24h: 43700, activeWallets: 96, lastSyncBlock: 1208455 },
      items: [
        { hash: '0x9a2f...11c4', type: 'swap', fromCompany: '헥토파이낸셜', toCompany: '헥토이노베이션', flow: '1,000 HFPC → 998 HIPC', status: 'success', time: '2분 전' },
        { hash: '0x7b6d...88e2', type: 'swap', fromCompany: '헥토헬스케어', toCompany: '헥토이노베이션', flow: '500 HHPC → 499 HIPC', status: 'success', time: '6분 전' },
        { hash: '0x1c4a...5f09', type: 'transfer', fromCompany: '올리브영', toCompany: '헥토헬스케어', flow: '2,340 OLIVEPC', status: 'pending', time: '11분 전' },
        { hash: '0x44df...c712', type: 'swap', fromCompany: '헥토헬스케어', toCompany: '헥토이노베이션', flow: '3,000 HHPC → 2,995 HIPC', status: 'success', time: '24분 전' },
        { hash: '0xe210...9a3b', type: 'swap', fromCompany: '원화 (KRW)', toCompany: '헥토파이낸셜', flow: '1,000 KRW → 998 HFPC', status: 'failed', time: '41분 전' },
      ],
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

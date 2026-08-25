import { computeSwapQuote } from '../lib/swap.js'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const ASSETS = [
  { symbol: 'HTC', name: '헥토그룹사 통합', balance: 12480, address: '0x8f3B...4aC1' },
  { symbol: 'HIC', name: '헥토이노베이션', balance: 3204, address: '0x2d91...77b4' },
  { symbol: 'HFC', name: '헥토파이낸셜', balance: 58900, address: '0x51ac...9e20' },
  { symbol: 'HHC', name: '헥토헬스케어', balance: 9121, address: '0x7f3d...2b6c' },
  { symbol: 'HDC', name: '헥토데이터', balance: 21340, address: '0x903e...c815' },
  { symbol: 'HMC', name: '헥토미디어', balance: 15770, address: '0x1aa4...f603' },
  { symbol: 'OYC', name: '올리브영', balance: 4850, address: '0x6ac2...d904' },
  { symbol: 'MUC', name: '무신사', balance: 6230, address: '0xb337...1e58' },
]

const HECTO_SYMBOLS = ['HTC', 'HIC', 'HFC', 'HHC', 'HDC', 'HMC']

export const mockApi = {
  async getAssets() {
    await delay()
    const totalSp = ASSETS.reduce((sum, a) => sum + a.balance, 0)
    return { totalSp, coins: ASSETS }
  },

  async getRates() {
    await delay()
    return { base: 'SP', rates: HECTO_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) }
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
      stats: { todayCount: 1284, volume24h: 182450, activeWallets: 342, lastSyncBlock: 1208455 },
      items: [
        { hash: '0x9a2f...11c4', type: 'swap', fromCompany: '헥토파이낸셜', toCompany: '헥토그룹', flow: '1,000 HFC → 998 HTC', status: 'success', time: '2분 전' },
        { hash: '0x7b6d...88e2', type: 'swap', fromCompany: '헥토미디어', toCompany: '헥토데이터', flow: '500 HMC → 499 HDC', status: 'success', time: '6분 전' },
        { hash: '0x1c4a...5f09', type: 'transfer', fromCompany: '헥토이노베이션', toCompany: '헥토헬스케어', flow: '2,340 HIC', status: 'pending', time: '11분 전' },
        { hash: '0x44df...c712', type: 'swap', fromCompany: '헥토헬스케어', toCompany: '헥토그룹', flow: '3,000 HHC → 2,995 HTC', status: 'success', time: '24분 전' },
        { hash: '0xe210...9a3b', type: 'transfer', fromCompany: '헥토그룹', toCompany: '헥토파이낸셜', flow: '5,000 HTC', status: 'failed', time: '41분 전' },
      ],
    }
  },

  async getSettlement() {
    await delay()
    return {
      period: '2026년 8월',
      summary: { txCount: 1284, netMoved: 486200, unsettled: 21400 },
      positions: [
        { company: '헥토그룹 (HTC 법인)', net: 48600 },
        { company: '헥토파이낸셜', net: -22900 },
        { company: '헥토이노베이션', net: 7200 },
        { company: '헥토헬스케어', net: -14300 },
        { company: '헥토데이터', net: 3100 },
        { company: '헥토미디어', net: -21700 },
      ],
      ledger: [
        { creditor: '헥토그룹', debtor: '헥토파이낸셜', flow: 'HFC → HTC', qty: 42000, sp: 42000, status: 'done' },
        { creditor: '헥토이노베이션', debtor: '헥토미디어', flow: 'HMC → HIC', qty: 8200, sp: 8200, status: 'done' },
        { creditor: '헥토그룹', debtor: '헥토헬스케어', flow: 'HHC → HTC', qty: 51000, sp: 51000, status: 'pending' },
        { creditor: '헥토데이터', debtor: '헥토미디어', flow: 'HMC → HDC', qty: 6400, sp: 6400, status: 'done' },
      ],
    }
  },
}

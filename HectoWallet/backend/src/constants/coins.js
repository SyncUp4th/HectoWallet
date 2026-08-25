export const COINS = [
  { symbol: 'USDT', name: 'Tether USD (연동 테스트용)' },
  { symbol: 'OLIVEPC', name: '올리브영' },
  { symbol: 'HHPC', name: '헥토헬스케어' },
  { symbol: 'HIPC', name: '헥토이노베이션' },
  { symbol: 'HFPC', name: '헥토파이낸셜' },
]

// The internal 1 coin = 1 SP peg only applies among Hecto's own subsidiary
// point coins — USDT (test-only, real market value) and OLIVEPC (partner
// brand point) stay asset-only, same as OYC/MUC were before the rename.
export const HECTO_SYMBOLS = ['HHPC', 'HIPC', 'HFPC']

export const SYMBOL_NAME = Object.fromEntries(COINS.map((c) => [c.symbol, c.name]))

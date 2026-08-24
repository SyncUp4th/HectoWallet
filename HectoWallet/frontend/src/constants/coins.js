export const COINS = [
  { symbol: 'HTC', name: '헥토그룹사 통합' },
  { symbol: 'HIC', name: '헥토이노베이션' },
  { symbol: 'HFC', name: '헥토파이낸셜' },
  { symbol: 'HHC', name: '헥토헬스케어' },
  { symbol: 'HDC', name: '헥토데이터' },
  { symbol: 'HMC', name: '헥토미디어' },
  { symbol: 'OYC', name: '올리브영' },
  { symbol: 'MUC', name: '무신사' },
]

export const HECTO_COINS = COINS.filter((c) => c.symbol !== 'OYC' && c.symbol !== 'MUC')

export function coinName(symbol) {
  return COINS.find((c) => c.symbol === symbol)?.name ?? symbol
}

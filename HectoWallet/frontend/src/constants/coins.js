export const COINS = [
  { symbol: 'USDT', name: '원화 (KRW)' },
  { symbol: 'OLIVEPC', name: '올리브영' },
  { symbol: 'HHPC', name: '헥토헬스케어' },
  { symbol: 'HIPC', name: '헥토이노베이션' },
  { symbol: 'HFPC', name: '헥토파이낸셜' },
]

// The internal 1 coin = 1 KRW peg covers Hecto's own subsidiary point coins
// plus the USDT contract, used here as the real-world reference asset since
// no separate KRW stablecoin was deployed for the demo — OLIVEPC (partner
// brand point) stays outside it, same as OYC/MUC were before the rename.
export const PEGGED_COINS = COINS.filter((c) => c.symbol === 'USDT' || c.symbol === 'HHPC' || c.symbol === 'HIPC' || c.symbol === 'HFPC')

export function coinName(symbol) {
  return COINS.find((c) => c.symbol === symbol)?.name ?? symbol
}

// The demo has no separately-deployed KRW stablecoin, so the real USDT
// contract stands in as the 1-KRW reference asset — every user-facing
// surface should show "KRW", never the underlying "USDT" ticker.
const DISPLAY_SYMBOL = { USDT: 'KRW' }
export function displaySymbol(symbol) {
  return DISPLAY_SYMBOL[symbol] ?? symbol
}

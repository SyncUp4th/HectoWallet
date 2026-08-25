export const COINS = [
  { symbol: 'USDT', name: '원화 (KRW)' },
  { symbol: 'OLIVEPC', name: '올리브영' },
  { symbol: 'HHPC', name: '헥토헬스케어' },
  { symbol: 'HIPC', name: '헥토이노베이션' },
  { symbol: 'HFPC', name: '헥토파이낸셜' },
]

// Every coin is swappable 1:1 with KRW — OLIVEPC (partner brand point)
// joined the same peg group so it can be swapped like the rest, even though
// it isn't a Hecto subsidiary coin.
export const PEGGED_SYMBOLS = COINS.map((c) => c.symbol)

export const SYMBOL_NAME = Object.fromEntries(COINS.map((c) => [c.symbol, c.name]))

// The demo has no separately-deployed KRW stablecoin, so the real USDT
// contract stands in as the 1-KRW reference asset — every user-facing
// surface should show "KRW", never the underlying "USDT" ticker.
const DISPLAY_SYMBOL = { USDT: 'KRW' }
export function displaySymbol(symbol) {
  return DISPLAY_SYMBOL[symbol] ?? symbol
}

export const SWAP_FEE_RATE = 0.0015
export const SLIPPAGE_TOLERANCE = 0.005

// All HectoWallet coins are pegged 1 coin = 1 SP, so a swap between any two
// coins is 1:1 before fees — only the fee and slippage tolerance move the amount.
export function computeSwapQuote(fromAmount) {
  const amount = Number(fromAmount) || 0
  const toAmount = Math.floor(amount * (1 - SWAP_FEE_RATE))
  const minReceived = Math.floor(toAmount * (1 - SLIPPAGE_TOLERANCE))
  return { toAmount, feeRate: SWAP_FEE_RATE, priceImpact: 0, minReceived }
}

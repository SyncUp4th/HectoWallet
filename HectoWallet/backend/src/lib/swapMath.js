export const SWAP_FEE_RATE = 0.0015
export const SLIPPAGE_TOLERANCE = 0.005

// Mirrors frontend/src/lib/swap.js — every HectoWallet coin is pegged 1:1 to
// KRW, so a swap only moves by the fee, never by a market rate.
export function computeSwapQuote(fromAmount) {
  const amount = Number(fromAmount) || 0
  const toAmount = Math.floor(amount * (1 - SWAP_FEE_RATE))
  const minReceived = Math.floor(toAmount * (1 - SLIPPAGE_TOLERANCE))
  return { toAmount, feeRate: SWAP_FEE_RATE, priceImpact: 0, minReceived }
}

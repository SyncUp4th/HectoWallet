import { Router } from 'express'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swapMath.js'
import { executeSwap, quoteSwapOnChain } from '../services/swapService.js'
import { logError } from '../lib/logger.js'

export const swapRouter = Router()

swapRouter.get('/rates', (req, res) => {
  res.json({ base: 'KRW', rates: PEGGED_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) })
})

// Quote from the live Uniswap pool, falling back to the flat-fee estimate
// when the chain is unreachable so the UI still shows a number.
swapRouter.post('/quote', async (req, res) => {
  const { fromSymbol, toSymbol, fromAmount } = req.body ?? {}
  try {
    const q = await quoteSwapOnChain({ fromSymbol, toSymbol, fromAmount: Number(fromAmount) })
    res.json({
      toAmount: q.toAmount,
      minReceived: q.minReceived,
      feeRate: q.feeRate,
      priceImpact: q.priceImpact,
      hops: q.hops,
      slippageTolerance: q.slippageTolerance,
      source: 'uniswap',
    })
  } catch (err) {
    logError('swap', 'on-chain quote failed, using flat-fee estimate', err)
    res.json({ ...computeSwapQuote(fromAmount), source: 'estimate' })
  }
})

// The operator wallet signs on behalf of the company (custodial model).
// Body: { fromSymbol, toSymbol, fromAmount }
// Returns: { txHash, fromSymbol, toSymbol, fromAmount, toAmount, hops, status, explorerUrl }
swapRouter.post('/execute', async (req, res) => {
  const { fromSymbol, toSymbol, fromAmount } = req.body ?? {}
  try {
    const result = await executeSwap({ fromSymbol, toSymbol, fromAmount: Number(fromAmount) })
    res.json(result)
  } catch (err) {
    logError('swap', 'executeSwap failed', err)
    res.status(400).json({ error: err.message })
  }
})

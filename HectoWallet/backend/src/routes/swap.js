import { Router } from 'express'
import { PEGGED_SYMBOLS } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swapMath.js'
import { getSwapContractConfig } from '../config.js'
import { executeSwap } from '../services/swapService.js'
import { logError } from '../lib/logger.js'

export const swapRouter = Router()

swapRouter.get('/rates', (req, res) => {
  res.json({ base: 'KRW', rates: PEGGED_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) })
})

swapRouter.post('/quote', (req, res) => {
  res.json(computeSwapQuote(req.body?.fromAmount))
})

swapRouter.get('/contract-config', (req, res) => {
  res.json(getSwapContractConfig())
})

// Custodial swap: treasury wallet signs on behalf of the company.
// Body: { fromSymbol, toSymbol, fromAmount }
// Returns: { txHash, fromSymbol, toSymbol, fromAmount, toAmount, status, explorerUrl }
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

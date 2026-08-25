import { Router } from 'express'
import { HECTO_SYMBOLS } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swapMath.js'
import { getSwapContractConfig } from '../config.js'

export const swapRouter = Router()

swapRouter.get('/rates', (req, res) => {
  res.json({ base: 'SP', rates: HECTO_SYMBOLS.map((symbol) => ({ symbol, rate: 1 })) })
})

swapRouter.post('/quote', (req, res) => {
  res.json(computeSwapQuote(req.body?.fromAmount))
})

// The browser wallet calls the swap contract directly — this backend never
// signs transactions. It just hands the frontend the address/ABI/chain to
// call, so both stay in sync from one place (fill in .env + swapAbi.json).
swapRouter.get('/contract-config', (req, res) => {
  res.json(getSwapContractConfig())
})

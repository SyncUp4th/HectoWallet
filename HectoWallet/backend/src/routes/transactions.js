import { Router } from 'express'
import { getTransactions } from '../services/etherscanService.js'

export const transactionsRouter = Router()

transactionsRouter.get('/', async (req, res) => {
  try {
    res.json(await getTransactions())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

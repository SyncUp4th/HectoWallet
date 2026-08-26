import { Router } from 'express'
import { getStoreProducts, purchaseProduct } from '../services/storeService.js'
import { logError } from '../lib/logger.js'

export const storeRouter = Router()

storeRouter.get('/products', (req, res) => {
  res.json(getStoreProducts())
})

// Settles a purchase on-chain: swaps in the shortfall if needed, then
// transfers the price out of the operator wallet to the merchant address.
storeRouter.post('/purchase', async (req, res) => {
  try {
    res.json(await purchaseProduct(req.body?.productId))
  } catch (err) {
    logError('store', 'purchase failed', err)
    res.status(400).json({ error: err.message })
  }
})

import { Router } from 'express'
import { getStoreProducts } from '../services/storeService.js'

export const storeRouter = Router()

storeRouter.get('/products', (req, res) => {
  res.json(getStoreProducts())
})

import { Router } from 'express'
import { getAssets } from '../services/assetsService.js'

export const walletRouter = Router()

walletRouter.get('/assets', async (req, res) => {
  try {
    res.json(await getAssets())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

import { Router } from 'express'
import { getSettlement } from '../services/settlementService.js'

export const settlementRouter = Router()

settlementRouter.get('/', (req, res) => {
  res.json(getSettlement())
})

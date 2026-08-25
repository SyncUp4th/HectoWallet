import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { walletRouter } from './routes/wallet.js'
import { swapRouter } from './routes/swap.js'
import { transactionsRouter } from './routes/transactions.js'
import { settlementRouter } from './routes/settlement.js'

export const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/wallet', walletRouter)
app.use('/api/swap', swapRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/settlement', settlementRouter)

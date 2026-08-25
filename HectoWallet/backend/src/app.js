import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { log } from './lib/logger.js'
import { walletRouter } from './routes/wallet.js'
import { swapRouter } from './routes/swap.js'
import { transactionsRouter } from './routes/transactions.js'
import { settlementRouter } from './routes/settlement.js'

export const app = express()
app.use(cors())
app.use(express.json())

// Every request here is a direct result of a frontend button/tab action
// (page load, retry click, swap quote, etc.) — logging the request line
// doubles as an action log without needing separate frontend instrumentation.
app.use((req, res, next) => {
  const startedAt = Date.now()
  res.on('finish', () => {
    log('http', `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`)
  })
  next()
})

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/wallet', walletRouter)
app.use('/api/swap', swapRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/settlement', settlementRouter)

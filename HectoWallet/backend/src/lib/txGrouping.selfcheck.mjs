import assert from 'node:assert'
import { groupIntoTransactions } from './txGrouping.js'

const ADDR = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'
const now = Math.floor(Date.now() / 1000)

const sampleTransfers = [
  // swap: two legs, same hash, opposite direction, different token
  { hash: '0xswap', from: ADDR, to: OTHER, value: '1000000000000000000000', tokenDecimal: '18', tokenSymbol: 'HFC', timeStamp: String(now - 120) },
  { hash: '0xswap', from: OTHER, to: ADDR, value: '998000000000000000000', tokenDecimal: '18', tokenSymbol: 'HTC', timeStamp: String(now - 120) },
  // plain transfer: single leg
  { hash: '0xtransfer', from: ADDR, to: OTHER, value: '5000000000000000000000', tokenDecimal: '18', tokenSymbol: 'HTC', timeStamp: String(now - 3600) },
]

const rows = groupIntoTransactions(sampleTransfers, ADDR)

assert.strictEqual(rows.length, 2)
const swapRow = rows.find((r) => r.hash === '0xswap')
assert.strictEqual(swapRow.type, 'swap')
assert.strictEqual(swapRow.flow, '1,000 HFC → 998 HTC')

const transferRow = rows.find((r) => r.hash === '0xtransfer')
assert.strictEqual(transferRow.type, 'transfer')
assert.strictEqual(transferRow.flow, '5,000 HTC')

// most recent (swap, 120s ago) sorts before the older transfer (1h ago)
assert.strictEqual(rows[0].hash, '0xswap')

console.log('txGrouping.selfcheck passed')

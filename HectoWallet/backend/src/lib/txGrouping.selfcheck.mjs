import assert from 'node:assert'
import { groupIntoTransactions } from './txGrouping.js'

const ADDR = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'
const POOL2 = '0x3333333333333333333333333333333333333333'
const BURN = '0x000000000000000000000000000000000000dEaD'
const now = Math.floor(Date.now() / 1000)

const sampleTransfers = [
  // Direct swap: one leg is the hub, so it used a single pool. Etherscan only
  // ever returns legs our address is party to, which is why no sample below
  // carries a pool-to-pool hub leg — it is invisible to this endpoint.
  { hash: '0xswap', from: ADDR, to: OTHER, value: '1000000', tokenDecimal: '6', tokenSymbol: 'HFPC', timeStamp: String(now - 120) },
  { hash: '0xswap', from: OTHER, to: ADDR, value: '999900', tokenDecimal: '6', tokenSymbol: 'USDT', timeStamp: String(now - 120) },
  // Hub-routed swap: neither side is the hub, and only X-hub pools exist, so
  // it must have gone through the hub even though that leg isn't in the data.
  { hash: '0xhub', from: ADDR, to: OTHER, value: '1000000000', tokenDecimal: '6', tokenSymbol: 'HFPC', timeStamp: String(now - 300) },
  { hash: '0xhub', from: POOL2, to: ADDR, value: '999800000', tokenDecimal: '6', tokenSymbol: 'HIPC', timeStamp: String(now - 300) },
  // store purchase: one-sided outgoing transfer to the merchant address
  { hash: '0xbuy', from: ADDR, to: BURN, value: '15000000000', tokenDecimal: '6', tokenSymbol: 'HHPC', timeStamp: String(now - 600) },
  // incoming top-up from someone else
  { hash: '0xfund', from: OTHER, to: ADDR, value: '5000000', tokenDecimal: '6', tokenSymbol: 'HIPC', timeStamp: String(now - 3600) },
]

const rows = groupIntoTransactions(sampleTransfers, ADDR)
assert.strictEqual(rows.length, 4)

const swapRow = rows.find((r) => r.hash === '0xswap')
assert.strictEqual(swapRow.type, 'swap')
assert.strictEqual(swapRow.hops, 1, 'a swap with a hub leg used one pool')
assert.strictEqual(swapRow.flow, '1 HFPC → 0 KRWC')

const hubRow = rows.find((r) => r.hash === '0xhub')
assert.strictEqual(hubRow.type, 'swap')
assert.strictEqual(hubRow.hops, 2, 'neither side is the hub, so it routed through it')
assert.strictEqual(hubRow.flow, '1,000 HFPC → 999 HIPC')
assert.strictEqual(hubRow.fromCompany, '헥토파이낸셜')
assert.strictEqual(hubRow.toCompany, '헥토이노베이션')

// Outgoing: our end named by company, the far end by address.
const buyRow = rows.find((r) => r.hash === '0xbuy')
assert.strictEqual(buyRow.type, 'transfer')
assert.strictEqual(buyRow.direction, 'out')
assert.strictEqual(buyRow.fromCompany, '헥토헬스케어')
assert.strictEqual(buyRow.toCompany, '0x0000...dEaD')
assert.strictEqual(buyRow.flow, '-15,000 HHPC')

// Incoming flips both the labels and the sign.
const fundRow = rows.find((r) => r.hash === '0xfund')
assert.strictEqual(fundRow.direction, 'in')
assert.strictEqual(fundRow.fromCompany, '0x2222...2222')
assert.strictEqual(fundRow.toCompany, '헥토이노베이션')
assert.strictEqual(fundRow.flow, '+5 HIPC')

// Newest first.
assert.deepStrictEqual(rows.map((r) => r.hash), ['0xswap', '0xhub', '0xbuy', '0xfund'])

console.log('txGrouping.selfcheck passed')

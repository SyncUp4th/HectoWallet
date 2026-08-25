import assert from 'node:assert'
import { computeSwapQuote } from './swapMath.js'

const q = computeSwapQuote(1000)
assert.strictEqual(q.toAmount, 998, `expected 998, got ${q.toAmount}`)
assert.strictEqual(q.minReceived, 993, `expected 993, got ${q.minReceived}`)
assert.strictEqual(computeSwapQuote(0).toAmount, 0)

console.log('swapMath.selfcheck passed')

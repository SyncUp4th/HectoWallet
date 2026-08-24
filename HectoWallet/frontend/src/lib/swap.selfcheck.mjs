import assert from 'node:assert'
import { computeSwapQuote } from './swap.js'

const q1 = computeSwapQuote(1000)
assert.strictEqual(q1.toAmount, 998, `expected 998, got ${q1.toAmount}`)
assert.strictEqual(q1.minReceived, 993, `expected 993, got ${q1.minReceived}`)

const q2 = computeSwapQuote(0)
assert.strictEqual(q2.toAmount, 0)
assert.strictEqual(q2.minReceived, 0)

const q3 = computeSwapQuote('not a number')
assert.strictEqual(q3.toAmount, 0)

console.log('swap.selfcheck passed')

import assert from 'node:assert'
import { rewardFor, REWARD_RATE } from './storeService.js'

assert.equal(REWARD_RATE, 0.02)

// Charged on the sale price, not the struck-through list price: the 2BOX set
// lists at 296,000 but is paid at 192,400, so the reward is 3,848 not 5,920.
assert.equal(rewardFor(192400), 3848)
assert.equal(rewardFor(142800), 2856)
assert.equal(rewardFor(12000), 240)

// Coins are whole numbers on every surface, so a fractional reward floors
// rather than rounding up — the merchant never pays out more than 2%.
assert.equal(rewardFor(99), 1, '1.98 floors to 1')
assert.equal(rewardFor(49), 0, 'below one whole coin pays nothing')
assert.ok(rewardFor(12345) <= 12345 * REWARD_RATE)

// A zero reward must stay zero so the caller can skip the payout entirely.
assert.equal(rewardFor(0), 0)

console.log('storeReward.selfcheck passed')

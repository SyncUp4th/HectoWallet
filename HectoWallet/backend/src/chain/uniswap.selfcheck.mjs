import assert from 'node:assert'
import { encodePath, buildRoute, POOL_FEE } from './uniswap.js'

const USDT = '0xD189647Fb095c4c54B6Aba89F480CEdEE5A8f7B1'
const HFPC = '0xe6a06b06b9b1D645F88bA6DF54080354316a7Fb8'
const HIPC = '0x8512f04f0a97b694ecCaBEED2EF75350fDf55676'

// Only X-USDT pools exist: a USDT leg swaps direct, anything else hops the hub.
assert.deepEqual(buildRoute(HFPC, USDT, USDT), [HFPC, USDT], 'to-hub should be direct')
assert.deepEqual(buildRoute(USDT, HFPC, USDT), [USDT, HFPC], 'from-hub should be direct')
assert.deepEqual(buildRoute(HFPC, HIPC, USDT), [HFPC, USDT, HIPC], 'coin-to-coin must hop the hub')

// Hub matching must survive checksum-case differences, or a direct swap would
// silently become a 3-hop route through the same token twice.
assert.deepEqual(buildRoute(HFPC, USDT.toLowerCase(), USDT), [HFPC, USDT.toLowerCase()], 'hub match is case-insensitive')

// V3 packs a path as address(20) + fee(3) + address(20) ... with no padding.
const single = encodePath([HFPC, USDT], [POOL_FEE])
assert.equal(single.length, 2 + (20 + 3 + 20) * 2, 'single-hop path is 43 bytes')

const multi = encodePath([HFPC, USDT, HIPC], [POOL_FEE, POOL_FEE])
assert.equal(multi.length, 2 + (20 + 3 + 20 + 3 + 20) * 2, 'multi-hop path is 66 bytes')

// The fee must land between the two addresses, not be appended or dropped.
assert.equal(single.toLowerCase(), ('0x' + HFPC.slice(2) + '000064' + USDT.slice(2)).toLowerCase(), 'fee is packed between tokens')

console.log('uniswap.selfcheck passed')

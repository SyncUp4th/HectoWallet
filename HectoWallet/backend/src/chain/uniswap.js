import { encodePacked } from 'viem'

// Uniswap V3 deployment on Sepolia.
export const SWAP_ROUTER_02 = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'
export const QUOTER_V2 = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'
export const UNISWAP_FACTORY = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c'

// Every HectoWallet pool was created at the 0.01% tier — the stablecoin tier,
// which is what a 1:1 peg wants (a wider tier would charge more for no benefit).
export const POOL_FEE = 100

// V3 fees are hundredths of a bip, so 1e6 is 100%.
export const FEE_DENOMINATOR = 1_000_000

// Each hop charges its own fee on the amount that survived the previous hop,
// so the rates compound rather than add. Compounded in integer fee-units and
// divided once at the end — `1 - 0.9999**1` in floats lands just under the
// true 0.0001, which is enough to render an exact 0.01% fee as "<0.01%".
export function feeRateForHops(hops) {
  const kept = BigInt(FEE_DENOMINATOR - POOL_FEE) ** BigInt(hops)
  const total = BigInt(FEE_DENOMINATOR) ** BigInt(hops)
  return Number(total - kept) / Number(total)
}

// Only X-USDT pools exist, so USDT is the routing hub: any coin-to-coin swap
// hops through it (HFPC -> USDT -> HIPC) while USDT pairs swap directly.
export const HUB_SYMBOL = 'USDT'

// V3 encodes a route as tightly-packed [token, fee, token, fee, token...].
export function encodePath(tokens, fees) {
  const types = []
  const values = []
  tokens.forEach((token, i) => {
    types.push('address')
    values.push(token)
    if (i < fees.length) {
      types.push('uint24')
      values.push(fees[i])
    }
  })
  return encodePacked(types, values)
}

// Returns the token addresses a swap routes through, hub-hopping when needed.
export function buildRoute(fromAddress, toAddress, hubAddress) {
  const direct = fromAddress.toLowerCase() === hubAddress.toLowerCase() || toAddress.toLowerCase() === hubAddress.toLowerCase()
  return direct ? [fromAddress, toAddress] : [fromAddress, hubAddress, toAddress]
}

export const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    name: 'exactInput',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'path', type: 'bytes' },
        { name: 'recipient', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
]

export const QUOTER_V2_ABI = [
  {
    type: 'function',
    name: 'quoteExactInput',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'path', type: 'bytes' }, { name: 'amountIn', type: 'uint256' }],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96AfterList', type: 'uint160[]' },
      { name: 'initializedTicksCrossedList', type: 'uint32[]' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
]

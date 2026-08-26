import { getOperatorAccount } from './chain/walletClient.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function getTokenAddress(symbol) {
  const value = process.env[`TOKEN_ADDRESS_${symbol}`]
  return value && value !== ZERO_ADDRESS ? value : null
}

// The signing key is the source of truth for which wallet the app operates —
// deriving the address from it makes key/address drift impossible. Falls back
// to the env var for read-only deploys that hold no key.
export function getOperatorAddress() {
  return getOperatorAccount()?.address ?? process.env.OPERATOR_ADDRESS ?? null
}

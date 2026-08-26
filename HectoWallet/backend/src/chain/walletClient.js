import { createWalletClient, http } from 'viem'
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { logError } from '../lib/logger.js'

// The operator wallet is this app's own EOA — it holds the balances shown in
// the app and signs its swaps. It is NOT the issuer EOA that minted the
// tokens and seeded the Uniswap pools; that key never touches this backend.
function buildAccount() {
  const key = (process.env.OPERATOR_PRIVATE_KEY || '').trim()
  if (key) {
    return privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  }
  const mnemonic = (process.env.OPERATOR_MNEMONIC || '').trim()
  if (mnemonic) {
    return mnemonicToAccount(mnemonic)
  }
  return null
}

let _account = undefined
export function getOperatorAccount() {
  if (_account !== undefined) return _account
  try {
    _account = buildAccount()
  } catch (err) {
    logError('wallet', 'Failed to load operator account from env', err)
    _account = null
  }
  return _account
}

export function getWalletClient() {
  const account = getOperatorAccount()
  if (!account) return null
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || undefined),
  })
}

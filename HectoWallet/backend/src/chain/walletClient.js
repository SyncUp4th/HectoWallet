import { createWalletClient, http } from 'viem'
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { logError } from '../lib/logger.js'

function buildAccount() {
  const key = (process.env.TREASURY_PRIVATE_KEY || '').trim()
  if (key) {
    return privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)
  }
  const mnemonic = (process.env.TREASURY_MNEMONIC || '').trim()
  if (mnemonic) {
    return mnemonicToAccount(mnemonic)
  }
  return null
}

let _account = undefined
export function getTreasuryAccount() {
  if (_account !== undefined) return _account
  try {
    _account = buildAccount()
  } catch (err) {
    logError('wallet', 'Failed to load treasury account from env', err)
    _account = null
  }
  return _account
}

export function getWalletClient() {
  const account = getTreasuryAccount()
  if (!account) return null
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || undefined),
  })
}

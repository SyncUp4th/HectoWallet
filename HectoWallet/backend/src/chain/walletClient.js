import { createWalletClient, http } from 'viem'
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { logError } from '../lib/logger.js'

// Two wallets sign here, and they are not interchangeable:
//   operator — this app's own wallet. Holds the displayed balances, pays for
//              purchases, and signs swaps.
//   merchant — receives purchase payments and pays the reward back out, so
//              rewards can't be signed without it.
// Neither is the issuer EOA that minted the tokens and seeded the Uniswap
// pools; that key never touches this backend.
const ROLES = {
  operator: { key: 'OPERATOR_PRIVATE_KEY', mnemonic: 'OPERATOR_MNEMONIC' },
  merchant: { key: 'MERCHANT_PRIVATE_KEY', mnemonic: 'MERCHANT_MNEMONIC' },
}

function buildAccount(role) {
  const env = ROLES[role]
  if (!env) throw new Error(`알 수 없는 지갑 역할: ${role}`)

  const key = (process.env[env.key] || '').trim()
  if (key) return privateKeyToAccount(key.startsWith('0x') ? key : `0x${key}`)

  const mnemonic = (process.env[env.mnemonic] || '').trim()
  if (mnemonic) return mnemonicToAccount(mnemonic)

  return null
}

const _accounts = new Map()
export function getAccount(role) {
  if (!_accounts.has(role)) {
    try {
      _accounts.set(role, buildAccount(role))
    } catch (err) {
      logError('wallet', `Failed to load ${role} account from env`, err)
      _accounts.set(role, null)
    }
  }
  return _accounts.get(role)
}

export function getWalletClientFor(role) {
  const account = getAccount(role)
  if (!account) return null
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || undefined),
  })
}

export const getOperatorAccount = () => getAccount('operator')
export const getWalletClient = () => getWalletClientFor('operator')

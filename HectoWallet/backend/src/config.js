import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTreasuryAccount } from './chain/walletClient.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function getTokenAddress(symbol) {
  const value = process.env[`TOKEN_ADDRESS_${symbol}`]
  return value && value !== ZERO_ADDRESS ? value : null
}

// The signing key is the source of truth for which wallet the app operates —
// deriving the address from it makes key/address drift impossible. Falls back
// to the env var for read-only deploys that hold no key.
export function getTreasuryAddress() {
  return getTreasuryAccount()?.address ?? process.env.TREASURY_ADDRESS ?? null
}

export function getSwapContractConfig() {
  const address = process.env.SWAP_CONTRACT_ADDRESS || null
  const abiPath = path.join(__dirname, 'chain', 'swapAbi.json')
  let abi = []
  try {
    abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'))
  } catch {
    abi = []
  }
  return { address, abi, chainId: 11155111, configured: Boolean(address && abi.length > 0) }
}

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function getTokenAddress(symbol) {
  const value = process.env[`TOKEN_ADDRESS_${symbol}`]
  return value && value !== ZERO_ADDRESS ? value : null
}

export function getTreasuryAddress() {
  return process.env.TREASURY_ADDRESS || null
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

import { getTreasuryAddress } from '../config.js'
import { groupIntoTransactions } from '../lib/txGrouping.js'

const SEPOLIA_CHAIN_ID = 11155111
const DAY_MS = 24 * 60 * 60 * 1000

export async function getTransactions() {
  const address = getTreasuryAddress()
  const apiKey = process.env.ETHERSCAN_API_KEY
  const emptyStats = { todayCount: 0, volume24h: 0, activeWallets: 0, lastSyncBlock: 0 }

  if (!address || !apiKey) {
    return { stats: emptyStats, items: [], configured: false }
  }

  const url = `https://api.etherscan.io/v2/api?chainid=${SEPOLIA_CHAIN_ID}&module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`
  const res = await fetch(url)
  const json = await res.json()

  if (json.status !== '1') {
    // Etherscan returns status "0" for both real errors and "no transactions found" — treat as empty, not fatal.
    return { stats: emptyStats, items: [], configured: true, note: json.message }
  }

  const transfers = json.result
  const items = groupIntoTransactions(transfers, address).slice(0, 25)

  const now = Date.now()
  const within24h = transfers.filter((t) => now - Number(t.timeStamp) * 1000 <= DAY_MS)
  const volume24h = within24h.reduce((sum, t) => sum + Number(BigInt(t.value) / 10n ** BigInt(t.tokenDecimal || '18')), 0)
  const lastSyncBlock = transfers.length ? Math.max(...transfers.map((t) => Number(t.blockNumber))) : 0

  return {
    stats: {
      todayCount: within24h.length,
      volume24h,
      activeWallets: new Set(transfers.flatMap((t) => [t.from.toLowerCase(), t.to.toLowerCase()])).size,
      lastSyncBlock,
    },
    items,
    configured: true,
  }
}

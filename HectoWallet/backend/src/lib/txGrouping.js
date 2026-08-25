import { SYMBOL_NAME, displaySymbol } from '../constants/coins.js'
import { relativeTime } from './relativeTime.js'

function formatAmount(transfer) {
  const value = BigInt(transfer.value)
  const decimals = BigInt(transfer.tokenDecimal || '18')
  return Number(value / 10n ** decimals)
}

function shortAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function companyLabel(symbol) {
  return SYMBOL_NAME[symbol] ?? symbol
}

// Etherscan's tokentx endpoint returns one row per ERC20 Transfer event, not
// per user-facing transaction. A swap moves two different tokens in the same
// tx hash (one out, one in) — group by hash and treat that pattern as a swap;
// anything else is a plain transfer.
// ponytail: heuristic, not authoritative event-log decoding — good enough
// for display, not for anything that needs to distinguish swap from a
// coincidental multi-token batch transfer.
export function groupIntoTransactions(transfers, address) {
  const addr = address.toLowerCase()
  const byHash = new Map()
  for (const t of transfers) {
    if (!byHash.has(t.hash)) byHash.set(t.hash, [])
    byHash.get(t.hash).push(t)
  }

  const rows = []
  for (const [hash, group] of byHash) {
    const outs = group.filter((t) => t.from.toLowerCase() === addr)
    const ins = group.filter((t) => t.to.toLowerCase() === addr)
    const timestampMs = Number(group[0].timeStamp) * 1000
    const distinctSymbols = new Set(group.map((t) => t.tokenSymbol))

    if (outs.length > 0 && ins.length > 0 && distinctSymbols.size > 1) {
      const out = outs[0]
      const inn = ins[0]
      rows.push({
        hash,
        type: 'swap',
        fromCompany: companyLabel(out.tokenSymbol),
        toCompany: companyLabel(inn.tokenSymbol),
        flow: `${formatAmount(out).toLocaleString()} ${displaySymbol(out.tokenSymbol)} → ${formatAmount(inn).toLocaleString()} ${displaySymbol(inn.tokenSymbol)}`,
        status: 'success',
        time: relativeTime(timestampMs),
        timestampMs,
      })
    } else {
      const t = group[0]
      rows.push({
        hash,
        type: 'transfer',
        fromCompany: shortAddress(t.from),
        toCompany: shortAddress(t.to),
        flow: `${formatAmount(t).toLocaleString()} ${displaySymbol(t.tokenSymbol)}`,
        status: 'success',
        time: relativeTime(timestampMs),
        timestampMs,
      })
    }
  }

  return rows.sort((a, b) => b.timestampMs - a.timestampMs)
}

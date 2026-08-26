import { SYMBOL_NAME, displaySymbol } from '../constants/coins.js'
import { HUB_SYMBOL } from '../chain/uniswap.js'
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
      // The hub leg moves pool-to-pool, so Etherscan's address-filtered
      // tokentx never returns it — hop count can't be counted from the rows.
      // Infer it from the pool topology instead: only X-hub pools exist, so a
      // swap where neither side is the hub must have routed through it.
      const touchesHub = out.tokenSymbol === HUB_SYMBOL || inn.tokenSymbol === HUB_SYMBOL
      const hops = touchesHub ? 1 : 2
      rows.push({
        hash,
        type: 'swap',
        hops,
        fromCompany: companyLabel(out.tokenSymbol),
        toCompany: companyLabel(inn.tokenSymbol),
        flow: `${formatAmount(out).toLocaleString()} ${displaySymbol(out.tokenSymbol)} → ${formatAmount(inn).toLocaleString()} ${displaySymbol(inn.tokenSymbol)}`,
        status: 'success',
        time: relativeTime(timestampMs),
        timestampMs,
      })
    } else {
      // One-sided move. Name our own end by the coin's company and the far end
      // by its address, so an outgoing store purchase reads as
      // "헥토헬스케어 → 0x0000...dEaD" rather than two opaque addresses.
      const t = outs[0] ?? ins[0] ?? group[0]
      const outgoing = t.from.toLowerCase() === addr
      rows.push({
        hash,
        type: 'transfer',
        direction: outgoing ? 'out' : 'in',
        fromCompany: outgoing ? companyLabel(t.tokenSymbol) : shortAddress(t.from),
        toCompany: outgoing ? shortAddress(t.to) : companyLabel(t.tokenSymbol),
        flow: `${outgoing ? '-' : '+'}${formatAmount(t).toLocaleString()} ${displaySymbol(t.tokenSymbol)}`,
        status: 'success',
        time: relativeTime(timestampMs),
        timestampMs,
      })
    }
  }

  return rows.sort((a, b) => b.timestampMs - a.timestampMs)
}

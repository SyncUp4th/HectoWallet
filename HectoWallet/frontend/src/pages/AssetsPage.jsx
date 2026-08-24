import { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import WalletCard from '../components/WalletCard.jsx'

export default function AssetsPage() {
  const [data, setData] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getAssets().then((res) => { if (!cancelled) setData(res) })
    return () => { cancelled = true }
  }, [])

  if (!data) return <div className="pageloading">불러오는 중…</div>

  return (
    <section className="panel">
      <h2 className="pagetitle">지갑 자산</h2>

      <div className="assets-header">
        <div>
          <p className="assets-total-label">총 보유자산</p>
          <p className="assets-total">{data.totalSp.toLocaleString()} SP</p>
        </div>
        <button className="addcoinbtn" aria-label="코인 추가">
          <i className="ti ti-plus" aria-hidden="true"></i>
        </button>
      </div>

      <div className="cardstack">
        {data.coins.map((coin, i) => (
          <WalletCard
            key={coin.symbol}
            coin={coin}
            expanded={expanded === coin.symbol}
            pushdown={expanded !== null && data.coins[i - 1]?.symbol === expanded}
            onToggle={() => setExpanded(expanded === coin.symbol ? null : coin.symbol)}
          />
        ))}
      </div>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'
import WalletCard from '../components/WalletCard.jsx'

export default function AssetsPage() {
  const { data, error, retry } = useApiData(() => api.getAssets())
  const [expanded, setExpanded] = useState(null)

  if (error) {
    return (
      <div className="pageerror">
        <span>자산을 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.</span>
        <button type="button" onClick={retry}>다시 시도</button>
      </div>
    )
  }
  if (!data) return <div className="pageloading">불러오는 중…</div>

  return (
    <section className="panel">
      <h2 className="pagetitle">지갑 자산</h2>

      <div className="assets-header">
        <p className="assets-total-label">총 보유자산</p>
        <p className="assets-total">{data.totalKrw.toLocaleString()} 원</p>
        <Link to="/swap" className="assets-swap-cta">
          <i className="ti ti-arrows-exchange" aria-hidden="true"></i> 코인 스왑하기
        </Link>
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

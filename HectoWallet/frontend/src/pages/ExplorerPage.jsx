import { useEffect, useState } from 'react'
import { api } from '../api/index.js'

const STATUS_LABEL = { success: '성공', pending: '대기', failed: '실패' }
const STATUS_CLASS = { success: 'badge-success', pending: 'badge-pending', failed: 'badge-failed' }
const TYPE_LABEL = { swap: '스왑', transfer: '전송' }
const TYPE_CLASS = { swap: 'badge-swap', transfer: 'badge-transfer' }

export default function ExplorerPage() {
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getTransactions().then((res) => { if (!cancelled) setData(res) })
    return () => { cancelled = true }
  }, [])

  if (!data) return <div className="pageloading">불러오는 중…</div>

  const q = query.trim()
  const filtered = q
    ? data.items.filter((tx) => tx.hash.includes(q) || tx.fromCompany.includes(q) || tx.toCompany.includes(q) || tx.flow.includes(q))
    : data.items

  return (
    <section className="panel">
      <h2 className="pagetitle">트랜잭션 탐색기</h2>

      <div className="searchbar">
        <input
          type="text"
          placeholder="주소, 트랜잭션 해시, 코인 심볼로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="searchbtn" type="button">검색</button>
      </div>

      <div className="statgrid">
        <div className="statcard"><div className="l">오늘 거래 수</div><div className="v">{data.stats.todayCount.toLocaleString()}건</div></div>
        <div className="statcard"><div className="l">24시간 거래대금</div><div className="v">{data.stats.volume24h.toLocaleString()} SP</div></div>
        <div className="statcard"><div className="l">활성 지갑</div><div className="v">{data.stats.activeWallets.toLocaleString()}개</div></div>
        <div className="statcard"><div className="l">최근 동기화 번호</div><div className="v">#{data.stats.lastSyncBlock.toLocaleString()}</div></div>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="tablewrap">
          <table className="txtable">
            <thead>
              <tr><th>해시</th><th>유형</th><th>흐름</th><th>수량</th><th>상태</th><th>시간</th></tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.hash}>
                  <td><span className="hashlink">{tx.hash}</span></td>
                  <td><span className={`badge ${TYPE_CLASS[tx.type]}`}>{TYPE_LABEL[tx.type]}</span></td>
                  <td className="flow">{tx.fromCompany} <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden="true"></i> {tx.toCompany}</td>
                  <td className="flow amt">{tx.flow}</td>
                  <td><span className={`badge ${STATUS_CLASS[tx.status]}`}>{STATUS_LABEL[tx.status]}</span></td>
                  <td className="timeago">{tx.time}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: '1.5rem 0' }}>검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

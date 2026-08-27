import { useState } from 'react'
import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'

const STATUS_LABEL = { success: '성공', pending: '대기', failed: '실패' }
const STATUS_CLASS = { success: 'badge-success', pending: 'badge-pending', failed: 'badge-failed' }
const TYPE_CLASS = { swap: 'badge-swap', transfer: 'badge-transfer' }

// A hub-routed swap and a one-sided transfer are worth distinguishing at a
// glance — the row already carries hops/direction, so read them here.
function typeLabel(tx) {
  if (tx.type === 'swap') return tx.hops === 2 ? '스왑 (경유)' : '스왑'
  if (tx.direction === 'in') return '입금'
  if (tx.direction === 'out') return '출금'
  return '전송'
}

function typeIcon(tx) {
  if (tx.type === 'swap') return 'ti-arrows-exchange'
  return tx.direction === 'in' ? 'ti-arrow-down-left' : 'ti-arrow-up-right'
}

// Mock data ships shortened placeholder hashes ("0x9a2f...11c4") that don't
// resolve on Etherscan — only link out once a real full hash is flowing in.
function isFullHash(hash) {
  return /^0x[0-9a-fA-F]{64}$/.test(hash)
}

export default function ExplorerPage() {
  const { data, error, retry } = useApiData(() => api.getTransactions())
  const [query, setQuery] = useState('')

  if (error) {
    return (
      <div className="pageerror">
        <span>거래내역을 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.</span>
        <button type="button" onClick={retry}>다시 시도</button>
      </div>
    )
  }
  if (!data) return <div className="pageloading">불러오는 중…</div>

  const q = query.trim()
  const filtered = q
    ? data.items.filter((tx) => tx.hash.includes(q) || tx.fromCompany.includes(q) || tx.toCompany.includes(q) || tx.flow.includes(q))
    : data.items

  return (
    <section className="panel">
      <h2 className="pagetitle">거래내역</h2>

      <div className="searchbar">
        <i className="ti ti-search" aria-hidden="true"></i>
        <input
          type="text"
          placeholder="주소, 해시, 코인 심볼로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="searchclear" onClick={() => setQuery('')} aria-label="검색어 지우기">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        )}
      </div>

      <div className="statgrid">
        <div className="statcard"><div className="l">24시간 거래 수</div><div className="v">{data.stats.todayCount.toLocaleString()}건</div></div>
        <div className="statcard"><div className="l">24시간 거래대금</div><div className="v">{data.stats.volume24h.toLocaleString()} 원</div></div>
        <div className="statcard"><div className="l">활성 지갑</div><div className="v">{data.stats.activeWallets.toLocaleString()}개</div></div>
        <div className="statcard"><div className="l">최근 동기화 번호</div><div className="v">#{data.stats.lastSyncBlock.toLocaleString()}</div></div>
      </div>

      <div className="rowlist">
        {filtered.map((tx) => (
          <div className="txrow" key={tx.hash}>
            <div className="txrow-top">
              <span className="txrow-type">
                <i className={`ti ${typeIcon(tx)}`} aria-hidden="true"></i>{typeLabel(tx)}
              </span>
              <span className={`badge ${STATUS_CLASS[tx.status]}`}>{STATUS_LABEL[tx.status]}</span>
            </div>
            <div className="txrow-flow">
              <span className={`badge ${TYPE_CLASS[tx.type]}`}>{tx.fromCompany}</span>
              <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden="true"></i>
              <span>{tx.toCompany}</span>
            </div>
            <div className={`txrow-amt${tx.direction ? ` dir-${tx.direction}` : ''}`}>{tx.flow}</div>
            <div className="txrow-meta">
              {isFullHash(tx.hash) ? (
                <a
                  className="hashlink"
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)} <i className="ti ti-external-link" style={{ fontSize: 11 }} aria-hidden="true"></i>
                </a>
              ) : (
                <span className="hashlink">{tx.hash}</span>
              )}
              <span className="timeago">{tx.time}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-note">검색 결과가 없습니다.</p>}
      </div>
    </section>
  )
}

import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'

// Standalone desktop page — not part of the mobile app shell/bottom nav.
// Settlement is a back-office tool, viewed on a PC, not a phone.
export default function SettlementPage() {
  const { data, error, retry } = useApiData(() => api.getSettlement())

  return (
    <div className="desktop-page">
      <div className="desktop-header">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div className="brand-name">HectoWallet · 정산 관리</div>
        </div>
      </div>

      {error && (
        <div className="pageerror">
          <span>정산 데이터를 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.</span>
          <button type="button" onClick={retry}>다시 시도</button>
        </div>
      )}
      {!error && !data && <div className="pageloading">불러오는 중…</div>}
      {!error && data && <SettlementBody data={data} />}
    </div>
  )
}

function SettlementBody({ data }) {
  const maxAbs = Math.max(1, ...data.positions.map((p) => Math.abs(p.net)))

  return (
    <section className="panel">
      <h2 className="pagetitle">계열사 정산</h2>

      <div className="settle-head">
        <div className="periodpill">
          <i className="ti ti-calendar" style={{ fontSize: 14 }} aria-hidden="true"></i>
          {data.period} 정산
        </div>
      </div>

      <div className="sumgrid">
        <div className="sumcard"><div className="l">정산 대상 거래</div><div className="v">{data.summary.txCount.toLocaleString()}건</div></div>
        <div className="sumcard"><div className="l">순이동 총액</div><div className="v">{data.summary.netMoved.toLocaleString()} KRW</div></div>
        <div className="sumcard"><div className="l">미정산 잔액</div><div className="v" style={{ color: 'var(--warn)' }}>{data.summary.unsettled.toLocaleString()} KRW</div></div>
      </div>

      <div className="section-h">법인별 순포지션</div>
      <div className="poslist">
        {data.positions.map((p) => {
          const pct = Math.round((Math.abs(p.net) / maxAbs) * 100)
          const positive = p.net >= 0
          return (
            <div className="posrow" key={p.company}>
              <div className="posrow-top">
                <span className="name">{p.company}</span>
                <span className="val" style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}>
                  {positive ? '+' : ''}{p.net.toLocaleString()} KRW
                </span>
              </div>
              <div className="bar">
                <div style={{ [positive ? 'left' : 'right']: 0, width: `${pct}%`, background: positive ? 'var(--success)' : 'var(--danger)' }}></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-h">법인 간 정산 내역</div>
      <div className="rowlist">
        {data.ledger.map((row, i) => (
          <div className="ledgerrow" key={i}>
            <div className="ledgerrow-top">
              <span className="ledgerrow-companies">{row.creditor} ← {row.debtor}</span>
              <span className={`badge ${row.status === 'done' ? 'badge-success' : 'badge-pending'}`}>
                {row.status === 'done' ? '정산완료' : '대기'}
              </span>
            </div>
            <div className="ledgerrow-flow">{row.flow}</div>
            <div className="ledgerrow-amt">
              {row.qty.toLocaleString()}
              <small>({row.krw.toLocaleString()} KRW)</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

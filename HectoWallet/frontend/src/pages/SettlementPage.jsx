import { useEffect, useState } from 'react'
import { api } from '../api/index.js'

export default function SettlementPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getSettlement().then((res) => { if (!cancelled) setData(res) })
    return () => { cancelled = true }
  }, [])

  if (!data) return <div className="pageloading">불러오는 중…</div>

  const maxAbs = Math.max(1, ...data.positions.map((p) => Math.abs(p.net)))

  return (
    <section className="panel">
      <h2 className="pagetitle">계열사 정산</h2>

      <div className="settle-head">
        <div className="periodpill">
          <i className="ti ti-calendar" style={{ fontSize: 14 }} aria-hidden="true"></i>
          {data.period} 정산
        </div>
        <button className="settle-cta" type="button">정산 실행</button>
      </div>

      <div className="sumgrid">
        <div className="sumcard"><div className="l">정산 대상 거래</div><div className="v">{data.summary.txCount.toLocaleString()}건</div></div>
        <div className="sumcard"><div className="l">순이동 총액</div><div className="v">{data.summary.netMoved.toLocaleString()} SP</div></div>
        <div className="sumcard"><div className="l">미정산 잔액</div><div className="v" style={{ color: 'var(--warn)' }}>{data.summary.unsettled.toLocaleString()} SP</div></div>
      </div>

      <div className="section-h">법인별 순포지션</div>
      <div className="poslist">
        {data.positions.map((p) => {
          const pct = Math.round((Math.abs(p.net) / maxAbs) * 50)
          const positive = p.net >= 0
          return (
            <div className="posrow" key={p.company}>
              <span className="name">{p.company}</span>
              <div className="bar">
                <div style={{ [positive ? 'left' : 'right']: '50%', width: `${pct}%`, background: positive ? 'var(--success)' : 'var(--danger)' }}></div>
              </div>
              <span className="val" style={{ color: positive ? 'var(--success)' : 'var(--danger)' }}>
                {positive ? '+' : ''}{p.net.toLocaleString()} SP
              </span>
            </div>
          )
        })}
      </div>

      <div className="section-h">법인 간 정산 내역</div>
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="tablewrap">
          <table className="ledger">
            <thead>
              <tr><th>채권사</th><th>채무사</th><th>코인 흐름</th><th>수량</th><th>SP 환산</th><th>상태</th></tr>
            </thead>
            <tbody>
              {data.ledger.map((row, i) => (
                <tr key={i}>
                  <td>{row.creditor}</td>
                  <td>{row.debtor}</td>
                  <td className="num-mono">{row.flow}</td>
                  <td className="num-mono">{row.qty.toLocaleString()}</td>
                  <td className="num-mono">{row.sp.toLocaleString()} SP</td>
                  <td><span className={`badge ${row.status === 'done' ? 'badge-success' : 'badge-pending'}`}>{row.status === 'done' ? '정산완료' : '대기'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

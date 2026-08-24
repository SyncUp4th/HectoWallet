import { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { HECTO_COINS, coinName } from '../constants/coins.js'

export default function SwapPage() {
  const [fromSymbol, setFromSymbol] = useState('HFC')
  const [toSymbol, setToSymbol] = useState('HTC')
  const [fromAmount, setFromAmount] = useState(1000)
  const [quote, setQuote] = useState(null)
  const [rates, setRates] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    api.getRates().then((r) => setRates(r.rates))
  }, [])

  useEffect(() => {
    let cancelled = false
    api.quoteSwap({ fromSymbol, toSymbol, fromAmount }).then((q) => { if (!cancelled) setQuote(q) })
    return () => { cancelled = true }
  }, [fromSymbol, toSymbol, fromAmount])

  function handleAmountChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, '')
    setFromAmount(digits ? Number(digits) : 0)
  }

  function handleFlip() {
    setFromSymbol(toSymbol)
    setToSymbol(fromSymbol)
  }

  async function handleSwap() {
    if (fromSymbol === toSymbol || fromAmount <= 0) return
    setSubmitting(true)
    setResult('')
    try {
      const res = await api.executeSwap({ fromSymbol, toSymbol, fromAmount })
      setResult(`${fromAmount.toLocaleString()} ${fromSymbol} → ${res.toAmount.toLocaleString()} ${toSymbol} 스왑 완료`)
    } catch {
      setResult('스왑에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const invalid = fromSymbol === toSymbol

  return (
    <section className="panel">
      <h2 className="pagetitle">코인 스왑</h2>

      <div className="grid2">
        <div className="swap-wrap">
          <div className="card swapcard">
            <div className="swaplabel">보낼 수량</div>
            <div className="swapbox">
              <input value={fromAmount.toLocaleString()} onChange={handleAmountChange} inputMode="numeric" />
              <select className="tokenselect" value={fromSymbol} onChange={(e) => setFromSymbol(e.target.value)}>
                {HECTO_COINS.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                ))}
              </select>
            </div>

            <div className="swap-flip">
              <button className="flipbtn" onClick={handleFlip} aria-label="보낼 코인과 받을 코인 바꾸기" type="button">
                <i className="ti ti-arrow-down" aria-hidden="true"></i>
              </button>
            </div>

            <div className="swaplabel">받을 수량 (예상)</div>
            <div className="swapbox">
              <input value={(quote?.toAmount ?? 0).toLocaleString()} readOnly />
              <select className="tokenselect" value={toSymbol} onChange={(e) => setToSymbol(e.target.value)}>
                {HECTO_COINS.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                ))}
              </select>
            </div>

            <div className="swap-details">
              <div><span>고정 교환비율</span><span>1 {fromSymbol} = 1 {toSymbol} (1 SP 공통 페그)</span></div>
              <div><span>가격 영향</span><span>0.00%</span></div>
              <div><span>스왑 수수료</span><span>{(((quote?.feeRate) ?? 0) * 100).toFixed(2)}%</span></div>
              <div><span>최소 수령량</span><span>{(quote?.minReceived ?? 0).toLocaleString()} {toSymbol}</span></div>
            </div>

            {invalid && <p style={{ fontSize: 12, color: 'var(--danger)', margin: '0 0 12px' }}>같은 코인끼리는 스왑할 수 없습니다.</p>}

            <button className="swap-cta" onClick={handleSwap} disabled={invalid || fromAmount <= 0 || submitting}>
              {submitting ? '처리 중…' : '스왑하기'}
            </button>

            {result && <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 10 }}>{result}</p>}
          </div>
        </div>

        <div>
          <div className="card rate-card" style={{ marginBottom: '1rem' }}>
            <h3>고정 교환비율 · 1 SP = 1 코인 (전 계열사 공통)</h3>
            <table className="ratetable">
              <tbody>
                {rates.map((r) => (
                  <tr key={r.symbol}><td>{r.symbol} {coinName(r.symbol)}</td><td>{r.rate}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card rate-card">
            <h3>최근 스왑</h3>
            <div className="mini-row"><span className="num-mono" style={{ fontSize: 12 }}>HHC → HTC</span><span className="timeago">24분 전</span></div>
            <div className="mini-row"><span className="num-mono" style={{ fontSize: 12 }}>HMC → HDC</span><span className="timeago">6분 전</span></div>
            <div className="mini-row" style={{ border: 'none' }}><span className="num-mono" style={{ fontSize: 12 }}>HFC → HTC</span><span className="timeago">2분 전</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import { PEGGED_COINS, displaySymbol } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swap.js'
import TokenSelect from '../components/TokenSelect.jsx'
import RateInfoTooltip from '../components/RateInfoTooltip.jsx'

export default function SwapPage() {
  const [searchParams] = useSearchParams()

  // Arriving from a wallet card's "스왑" button preselects that coin.
  const requestedFrom = searchParams.get('from')
  const initialFrom = PEGGED_COINS.some((c) => c.symbol === requestedFrom) ? requestedFrom : 'HFPC'
  const initialTo = PEGGED_COINS.find((c) => c.symbol !== initialFrom)?.symbol ?? 'HIPC'

  const [fromSymbol, setFromSymbol] = useState(initialFrom)
  const [toSymbol, setToSymbol] = useState(initialTo)
  const [fromAmount, setFromAmount] = useState(1000)
  const [quote, setQuote] = useState(null)
  const [rates, setRates] = useState([])
  const [assets, setAssets] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    api.getRates().then((r) => setRates(r.rates)).catch(() => setRates([]))
    api.getAssets().then(setAssets).catch(() => setAssets(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    api.quoteSwap({ fromSymbol, toSymbol, fromAmount })
      .then((q) => { if (!cancelled) setQuote(q) })
      .catch(() => { if (!cancelled) setQuote(computeSwapQuote(fromAmount)) })
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

  const invalid = fromSymbol === toSymbol
  const fromBalance = assets?.coins.find((c) => c.symbol === fromSymbol)?.balance ?? 0

  async function handleSwap() {
    if (invalid || fromAmount <= 0) return
    setSubmitting(true)
    setResult('')
    try {
      const q = computeSwapQuote(fromAmount)
      await new Promise((r) => setTimeout(r, 400))
      setResult(`${fromAmount.toLocaleString()} ${displaySymbol(fromSymbol)} → ${q.toAmount.toLocaleString()} ${displaySymbol(toSymbol)} 스왑 완료`)
    } catch (err) {
      setResult(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="pagetitle">코인 스왑</h2>

      <div className="swap-balance">
        <span>보낼 코인 보유 자산</span>
        <span>{fromBalance.toLocaleString()} {displaySymbol(fromSymbol)}</span>
      </div>

      <div className="card swapcard">
        <div className="swaplabel">보낼 수량</div>
        <div className="swapbox">
          <input value={fromAmount.toLocaleString()} onChange={handleAmountChange} inputMode="numeric" />
          <TokenSelect coins={PEGGED_COINS} value={fromSymbol} onChange={setFromSymbol} />
        </div>

        <div className="swap-flip">
          <button className="flipbtn" onClick={handleFlip} aria-label="보낼 코인과 받을 코인 바꾸기" type="button">
            <i className="ti ti-arrows-up-down" aria-hidden="true"></i>
          </button>
        </div>

        <div className="swaplabel">받을 수량 (예상)</div>
        <div className="swapbox">
          <input value={(quote?.toAmount ?? 0).toLocaleString()} readOnly />
          <TokenSelect coins={PEGGED_COINS} value={toSymbol} onChange={setToSymbol} />
        </div>

        <div className="swap-details">
          <div>
            <span className="rate-label-wrap">고정 교환비율<RateInfoTooltip rates={rates} /></span>
            <span>1 {displaySymbol(fromSymbol)} = 1 {displaySymbol(toSymbol)} (1 원 공통 페그)</span>
          </div>
          <div><span>가격 영향</span><span>0.00%</span></div>
          <div><span>스왑 수수료</span><span>{(((quote?.feeRate) ?? 0) * 100).toFixed(2)}%</span></div>
          <div><span>최소 수령량</span><span>{(quote?.minReceived ?? 0).toLocaleString()} {displaySymbol(toSymbol)}</span></div>
        </div>

        {invalid && <p className="swap-error">같은 코인끼리는 스왑할 수 없습니다.</p>}

        <button className="swap-cta" onClick={handleSwap} disabled={invalid || fromAmount <= 0 || submitting}>
          {submitting ? '처리 중…' : '스왑하기'}
        </button>

        {result && <p className="swap-result">{result}</p>}
      </div>
    </section>
  )
}

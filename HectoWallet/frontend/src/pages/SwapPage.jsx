import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/index.js'
import { PEGGED_COINS, displaySymbol } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swap.js'
import TokenSelect from '../components/TokenSelect.jsx'
import RateInfoTooltip from '../components/RateInfoTooltip.jsx'

// Pool fees here are 0.01%, so two decimals is the floor that shows them at
// all — anything smaller is real but not worth a digit, hence the "<" form.
function formatPercent(rate) {
  const pct = (rate ?? 0) * 100
  if (pct === 0) return '0.00%'
  if (pct < 0.01) return '<0.01%'
  return `${pct.toFixed(2)}%`
}

const DELTA_VISIBLE_MS = 9000

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
  const [result, setResult] = useState(null)
  const [delta, setDelta] = useState(null)
  const timers = useRef([])

  function loadAssets() {
    api.getAssets().then(setAssets).catch(() => {})
  }

  useEffect(() => {
    api.getRates().then((r) => setRates(r.rates)).catch(() => setRates([]))
    loadAssets()
    return () => timers.current.forEach(clearTimeout)
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
  const balanceOf = (symbol) => assets?.coins.find((c) => c.symbol === symbol)?.balance ?? 0
  const fromBalance = balanceOf(fromSymbol)
  const toBalance = balanceOf(toSymbol)

  async function handleSwap() {
    if (invalid || fromAmount <= 0) return
    setSubmitting(true)
    setResult(null)
    setDelta(null)
    try {
      const res = await api.executeSwap({ fromSymbol, toSymbol, fromAmount })
      setResult({ ok: true, ...res })

      // The tx is submitted, not yet mined, so the balances on chain haven't
      // moved — show what the swap sends and receives right away, and refetch
      // once the block has had time to land so the absolute figures catch up.
      setDelta({ from: fromSymbol, to: toSymbol, out: res.fromAmount, in: res.toAmount })
      timers.current.push(
        setTimeout(loadAssets, 6000),
        setTimeout(loadAssets, 16000),
        setTimeout(() => setDelta(null), DELTA_VISIBLE_MS),
      )
    } catch (err) {
      setResult({ ok: false, message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const settling = Boolean(delta)

  return (
    <section className="panel">
      <h2 className="pagetitle">코인 스왑</h2>

      <div className={'swap-wallet' + (settling ? ' settling' : '')}>
        <div className="swap-wallet-row">
          <span>
            <i className="ti ti-arrow-up-right" aria-hidden="true"></i>
            보낼 코인 {displaySymbol(fromSymbol)}
          </span>
          <span className="swap-wallet-amt">
            {fromBalance.toLocaleString()}
            {delta && <em className="delta out">−{delta.out.toLocaleString()}</em>}
          </span>
        </div>
        <div className="swap-wallet-row">
          <span>
            <i className="ti ti-arrow-down-left" aria-hidden="true"></i>
            받을 코인 {displaySymbol(toSymbol)}
          </span>
          <span className="swap-wallet-amt">
            {toBalance.toLocaleString()}
            {delta && <em className="delta in">+{delta.in.toLocaleString()}</em>}
          </span>
        </div>
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
          <div>
            <span>스왑 경로</span>
            <span>
              {quote?.hops === 2
                ? `${displaySymbol(fromSymbol)} → KRWC → ${displaySymbol(toSymbol)}`
                : `${displaySymbol(fromSymbol)} → ${displaySymbol(toSymbol)}`}
            </span>
          </div>
          <div>
            <span>스왑 수수료</span>
            <span>{formatPercent(quote?.feeRate)}{quote?.hops === 2 ? ' (2개 풀)' : ''}</span>
          </div>
          {quote?.source === 'estimate' && (
            <div><span>견적 기준</span><span>추정치 (풀 조회 실패)</span></div>
          )}
        </div>

        {invalid && <p className="swap-error">같은 코인끼리는 스왑할 수 없습니다.</p>}

        <button className="swap-cta" onClick={handleSwap} disabled={invalid || fromAmount <= 0 || submitting}>
          {submitting
            ? <><i className="ti ti-loader-2 spin" aria-hidden="true"></i> 스왑 처리 중…</>
            : '스왑하기'}
        </button>

        {result?.ok && (
          <p className="swap-result">
            <i className="ti ti-circle-check" aria-hidden="true"></i>
            {result.fromAmount.toLocaleString()} {displaySymbol(result.fromSymbol)} → {result.toAmount.toLocaleString()} {displaySymbol(result.toSymbol)} 스왑 완료{' '}
            <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="swap-txlink">
              Etherscan <i className="ti ti-external-link" style={{ fontSize: 11 }} aria-hidden="true"></i>
            </a>
          </p>
        )}
        {result && !result.ok && <p className="swap-error">{result.message}</p>}
      </div>
    </section>
  )
}

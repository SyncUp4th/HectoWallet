import { useEffect, useRef, useState } from 'react'
import { coinName, displaySymbol } from '../constants/coins.js'

export default function RateInfoTooltip({ rates }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <span className="rateinfo" ref={rootRef}>
      <button
        type="button"
        className="rateinfo-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="고정 교환비율 상세 보기"
        aria-expanded={open}
      >
        <i className="ti ti-info-circle" aria-hidden="true"></i>
      </button>
      {open && (
        <div className="rateinfo-panel" role="tooltip">
          <p className="rateinfo-title">1 KRW = 1 코인 (전 계열사 공통)</p>
          <ul>
            {rates.map((r) => (
              <li key={r.symbol}>
                <span>{displaySymbol(r.symbol)} {coinName(r.symbol)}</span>
                <span>{r.rate}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}

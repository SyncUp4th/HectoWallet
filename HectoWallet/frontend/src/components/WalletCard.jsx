import { useState } from 'react'
import { HECTO_COINS } from '../constants/coins.js'

const PEGGED_SYMBOLS = new Set(HECTO_COINS.map((c) => c.symbol))

export default function WalletCard({ coin, expanded, pushdown, onToggle }) {
  const [showToast, setShowToast] = useState(false)
  const isPegged = PEGGED_SYMBOLS.has(coin.symbol)

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(coin.address).catch(() => {})
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1600)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  const className = ['walletcard', expanded && 'expanded', pushdown && 'pushdown'].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      style={{ background: `var(--card-${coin.symbol.toLowerCase()})` }}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="wc-head">
        <div className="wc-id">
          <div className="wc-badge">{coin.symbol}</div>
          <div className="wc-name">{coin.name}</div>
        </div>
        <div className="wc-amt">
          {coin.balance.toLocaleString()}
          <small>{coin.symbol}</small>
        </div>
      </div>
      <div className="wc-body">
        <div className="wc-balance">{coin.balance.toLocaleString()} {coin.symbol}</div>
        <div className="wc-krw">
          {isPegged ? `${coin.balance.toLocaleString()} SP · 1 ${coin.symbol} = 1 SP` : '헥토 계열사 SP 페그 대상 아님'}
        </div>
        <div className="wc-actions">
          <button className="wc-actbtn" onClick={(e) => e.stopPropagation()}>보내기</button>
          <button className="wc-actbtn" onClick={(e) => e.stopPropagation()}>받기</button>
          <button className="wc-actbtn" onClick={(e) => e.stopPropagation()}>스왑</button>
        </div>
        <div className="wc-addr" onClick={handleCopy}>
          <span>{coin.address}</span>
          <i className="ti ti-copy" style={{ fontSize: 14 }} aria-hidden="true"></i>
        </div>
      </div>
      <div className={'wc-toast' + (showToast ? ' show' : '')}>주소를 복사했습니다</div>
    </div>
  )
}

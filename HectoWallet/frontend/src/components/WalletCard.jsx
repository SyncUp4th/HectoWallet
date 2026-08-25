import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { displaySymbol } from '../constants/coins.js'

export default function WalletCard({ coin, expanded, pushdown, onToggle }) {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)
  const label = displaySymbol(coin.symbol)

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard?.writeText(coin.address).catch(() => {})
    setShowToast(true)
    setTimeout(() => setShowToast(false), 1600)
  }

  function handleSwap(e) {
    e.stopPropagation()
    navigate(`/swap?from=${coin.symbol}`)
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
          <div className="wc-badge">{label}</div>
          <div className="wc-name">{coin.name}</div>
        </div>
        <div className="wc-amt">
          {coin.balance.toLocaleString()}
          <small>{label}</small>
        </div>
      </div>
      <div className="wc-body">
        <div className="wc-balance">{coin.balance.toLocaleString()} {label}</div>
        <div className="wc-krw">
          {coin.symbol === 'USDT' ? 'KRW 1:1 기준 자산' : `${coin.balance.toLocaleString()} KRW · 1 ${label} = 1 KRW`}
        </div>
        <div className="wc-actions">
          <button className="wc-actbtn" onClick={(e) => e.stopPropagation()}>보내기</button>
          <button className="wc-actbtn" onClick={(e) => e.stopPropagation()}>받기</button>
          <button className="wc-actbtn" onClick={handleSwap}>스왑</button>
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

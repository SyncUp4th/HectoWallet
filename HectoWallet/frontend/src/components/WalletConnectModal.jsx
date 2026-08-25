import { useState } from 'react'
import { useConnect } from 'wagmi'

// Fixed, Uniswap-style list rather than whatever wagmi happens to auto-detect
// — MetaMask/Binance both resolve to the generic injected() connector unless
// EIP-6963 announces a more specific one, since only one provider can be
// "the" injected wallet in a given browser at a time.
const WALLET_OPTIONS = [
  { key: 'walletconnect', label: 'WalletConnect', color: '#3B99FC', icon: 'ti-scan', match: (c) => c.id === 'walletConnect' },
  { key: 'metamask', label: 'MetaMask', color: '#F6851B', icon: 'ti-wallet', match: (c) => c.name?.toLowerCase().includes('metamask') },
  { key: 'coinbase', label: 'Coinbase Wallet', color: '#0052FF', icon: 'ti-wallet', match: (c) => c.id === 'coinbaseWalletSDK' },
  { key: 'binance', label: 'Binance Wallet', color: '#F0B90B', icon: 'ti-wallet', match: (c) => c.name?.toLowerCase().includes('binance') },
]

const INJECTED_FALLBACK_KEYS = new Set(['metamask', 'binance'])

export default function WalletConnectModal({ onClose }) {
  const { connect, connectors, isPending } = useConnect()
  const [error, setError] = useState('')

  function resolveConnector(option) {
    const found = connectors.find(option.match)
    if (found) return found
    if (INJECTED_FALLBACK_KEYS.has(option.key)) {
      return connectors.find((c) => c.id === 'injected') ?? null
    }
    return null
  }

  function handlePick(option) {
    const connector = resolveConnector(option)
    if (!connector) {
      setError(`${option.label}을(를) 사용하려면 브라우저 확장 프로그램 설치 또는 추가 설정이 필요합니다.`)
      return
    }
    setError('')
    connect({ connector })
    onClose()
  }

  return (
    <div className="walletmodal-backdrop" onClick={onClose}>
      <div className="walletmodal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="지갑 연결하기">
        <div className="walletmodal-head">
          <span>지갑 연결하기</span>
          <button type="button" className="walletmodal-close" onClick={onClose} aria-label="닫기">
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <ul className="walletmodal-list">
          {WALLET_OPTIONS.map((opt) => (
            <li key={opt.key}>
              <button type="button" className="walletmodal-item" disabled={isPending} onClick={() => handlePick(opt)}>
                <span className="walletmodal-icon" style={{ background: opt.color }}>
                  <i className={`ti ${opt.icon}`} aria-hidden="true"></i>
                </span>
                {opt.label}
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="walletmodal-error">{error}</p>}

        <p className="walletmodal-disclaimer">
          지갑을 연결하면 서비스 이용약관에 동의하고 개인정보 처리방침을 확인한 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { api } from '../api/index.js'
import { HECTO_COINS, coinName } from '../constants/coins.js'
import { computeSwapQuote } from '../lib/swap.js'
import TokenSelect from '../components/TokenSelect.jsx'
import WalletConnectModal from '../components/WalletConnectModal.jsx'

// Called only once a wallet is connected and the backend reports a
// configured swap contract (address + non-empty ABI). The exact function
// name/argument order depends on the real ABI, which isn't available yet —
// wire this up as soon as it is, instead of guessing a signature now.
async function executeOnChainSwap() {
  throw new Error('스왑 컨트랙트 ABI가 아직 연결되지 않았습니다. ABI가 준비되면 이 함수만 채우면 됩니다.')
}

export default function SwapPage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  const [fromSymbol, setFromSymbol] = useState('HFC')
  const [toSymbol, setToSymbol] = useState('HTC')
  const [fromAmount, setFromAmount] = useState(1000)
  const [quote, setQuote] = useState(null)
  const [rates, setRates] = useState([])
  const [contractConfig, setContractConfig] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    api.getRates().then((r) => setRates(r.rates)).catch(() => setRates([]))
    api.getSwapContractConfig().then(setContractConfig).catch(() => setContractConfig({ address: null, abi: [], configured: false }))
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
  const onChainReady = isConnected && contractConfig?.configured

  async function handleSwap() {
    if (invalid || fromAmount <= 0) return
    setSubmitting(true)
    setResult('')
    try {
      if (onChainReady) {
        await executeOnChainSwap()
      } else {
        const q = computeSwapQuote(fromAmount)
        await new Promise((r) => setTimeout(r, 400))
        setResult(`(데모) ${fromAmount.toLocaleString()} ${fromSymbol} → ${q.toAmount.toLocaleString()} ${toSymbol} 스왑 완료`)
      }
    } catch (err) {
      setResult(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <h2 className="pagetitle">코인 스왑</h2>

      <div className="walletbar">
        {isConnected ? (
          <>
            <span className="walletbar-addr"><i className="ti ti-plug-connected" style={{ fontSize: 14 }} aria-hidden="true"></i>{address.slice(0, 6)}...{address.slice(-4)}</span>
            <button type="button" className="walletbar-disconnect" onClick={() => disconnect()}>연결 해제</button>
          </>
        ) : (
          <button type="button" className="walletbar-connect-btn" onClick={() => setWalletModalOpen(true)}>
            <i className="ti ti-wallet" aria-hidden="true"></i>
            지갑 연결하기
          </button>
        )}
      </div>

      {walletModalOpen && <WalletConnectModal onClose={() => setWalletModalOpen(false)} />}

      <div className="card swapcard">
        <div className="swaplabel">보낼 수량</div>
        <div className="swapbox">
          <input value={fromAmount.toLocaleString()} onChange={handleAmountChange} inputMode="numeric" />
          <TokenSelect coins={HECTO_COINS} value={fromSymbol} onChange={setFromSymbol} />
        </div>

        <div className="swap-flip">
          <button className="flipbtn" onClick={handleFlip} aria-label="보낼 코인과 받을 코인 바꾸기" type="button">
            <i className="ti ti-arrow-down" aria-hidden="true"></i>
          </button>
        </div>

        <div className="swaplabel">받을 수량 (예상)</div>
        <div className="swapbox">
          <input value={(quote?.toAmount ?? 0).toLocaleString()} readOnly />
          <TokenSelect coins={HECTO_COINS} value={toSymbol} onChange={setToSymbol} />
        </div>

        <div className="swap-details">
          <div><span>고정 교환비율</span><span>1 {fromSymbol} = 1 {toSymbol} (1 SP 공통 페그)</span></div>
          <div><span>가격 영향</span><span>0.00%</span></div>
          <div><span>스왑 수수료</span><span>{(((quote?.feeRate) ?? 0) * 100).toFixed(2)}%</span></div>
          <div><span>최소 수령량</span><span>{(quote?.minReceived ?? 0).toLocaleString()} {toSymbol}</span></div>
        </div>

        {invalid && <p className="swap-error">같은 코인끼리는 스왑할 수 없습니다.</p>}
        {!onChainReady && <p className="swap-note">{isConnected ? '스왑 컨트랙트 설정 대기 중 — 데모 시뮬레이션으로 동작합니다.' : '지갑을 연결하면 실제 온체인 스왑을 사용할 수 있습니다.'}</p>}

        <button className="swap-cta" onClick={handleSwap} disabled={invalid || fromAmount <= 0 || submitting}>
          {submitting ? '처리 중…' : onChainReady ? '온체인 스왑하기' : '스왑하기 (데모)'}
        </button>

        {result && <p className="swap-result">{result}</p>}
      </div>

      <div className="card rate-card">
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
        <div className="mini-row"><span className="hashlink" style={{ fontSize: 12.5 }}>HHC → HTC</span><span className="timeago">24분 전</span></div>
        <div className="mini-row"><span className="hashlink" style={{ fontSize: 12.5 }}>HMC → HDC</span><span className="timeago">6분 전</span></div>
        <div className="mini-row" style={{ border: 'none' }}><span className="hashlink" style={{ fontSize: 12.5 }}>HFC → HTC</span><span className="timeago">2분 전</span></div>
      </div>
    </section>
  )
}

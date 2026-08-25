import { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'
import { PEGGED_COINS, displaySymbol } from '../constants/coins.js'
import { computeSwapQuote, SWAP_FEE_RATE } from '../lib/swap.js'

export default function StorePage() {
  const { data, error, retry } = useApiData(() => api.getStoreProducts())
  const [assets, setAssets] = useState(null)
  const [results, setResults] = useState({})
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    api.getAssets().then(setAssets).catch(() => setAssets(null))
  }, [])

  if (error) {
    return (
      <div className="pageerror">
        <span>스토어 상품을 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.</span>
        <button type="button" onClick={retry}>다시 시도</button>
      </div>
    )
  }
  if (!data) return <div className="pageloading">불러오는 중…</div>

  function balanceOf(symbol) {
    return assets?.coins.find((c) => c.symbol === symbol)?.balance ?? 0
  }

  async function handleBuy(product) {
    setBuyingId(product.id)
    await new Promise((r) => setTimeout(r, 400))

    const hhpcBalance = balanceOf('HHPC')
    if (hhpcBalance >= product.priceHhpc) {
      setResults((r) => ({ ...r, [product.id]: `HHPC ${product.priceHhpc.toLocaleString()}으로 구매를 완료했습니다.` }))
      setBuyingId(null)
      return
    }

    // Not enough HHPC — auto-swap the shortfall from the first other coin
    // that has enough balance to cover it after the swap fee.
    const shortfall = product.priceHhpc - hhpcBalance
    const neededFromAmount = Math.ceil(shortfall / (1 - SWAP_FEE_RATE))
    const donor = PEGGED_COINS
      .filter((c) => c.symbol !== 'HHPC')
      .map((c) => ({ ...c, balance: balanceOf(c.symbol) }))
      .find((c) => c.balance >= neededFromAmount)

    if (!donor) {
      setResults((r) => ({ ...r, [product.id]: '보유 자산이 부족해 구매할 수 없습니다.' }))
      setBuyingId(null)
      return
    }

    const swappedIn = computeSwapQuote(neededFromAmount).toAmount
    setResults((r) => ({
      ...r,
      [product.id]: `${displaySymbol(donor.symbol)} ${neededFromAmount.toLocaleString()}개를 HHPC ${swappedIn.toLocaleString()}으로 자동 스왑해 구매를 완료했습니다.`,
    }))
    setBuyingId(null)
  }

  return (
    <section className="panel">
      <h2 className="pagetitle">스토어</h2>
      <p className="store-sub">
        {data.brand} 상품을 {data.currency}로 구매할 수 있습니다. {data.currency}가 부족하면 다른 보유 코인이 자동으로 스왑됩니다.
      </p>

      <div className="storelist">
        {data.products.map((p) => (
          <div className="storecard" key={p.id}>
            <div className="storecard-icon"><i className="ti ti-pill" aria-hidden="true"></i></div>
            <div className="storecard-body">
              <div className="storecard-name">{p.name}</div>
              <div className="storecard-desc">{p.description}</div>
              <div className="storecard-row">
                <span className="storecard-price">{p.priceHhpc.toLocaleString()} HHPC</span>
                <button className="storecard-buy" onClick={() => handleBuy(p)} disabled={buyingId === p.id}>
                  {buyingId === p.id ? '처리 중…' : '구매하기'}
                </button>
              </div>
              {results[p.id] && <p className="storecard-result">{results[p.id]}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

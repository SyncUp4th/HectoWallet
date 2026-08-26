import { useEffect, useState } from 'react'
import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'
import { displaySymbol } from '../constants/coins.js'

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

  const heldCurrency = assets?.coins.find((c) => c.symbol === data.currency)?.balance ?? 0

  // The purchase settles on-chain, so a swap leg has to confirm before the
  // transfer can go out — this is slow by nature, not a hung request.
  async function handleBuy(product) {
    setBuyingId(product.id)
    setResults((r) => ({ ...r, [product.id]: null }))
    try {
      const res = await api.purchaseProduct(product.id)
      setResults((r) => ({ ...r, [product.id]: { ok: true, ...res } }))
      api.getAssets().then(setAssets).catch(() => {})
    } catch (err) {
      setResults((r) => ({ ...r, [product.id]: { ok: false, message: err.message } }))
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <section className="panel">
      <h2 className="pagetitle">스토어</h2>
      <p className="store-sub">
        {data.brand} 상품을 {data.currency}로 구매할 수 있습니다. {data.currency}가 부족하면 다른 보유 코인이 자동으로 스왑됩니다.
      </p>

      <div className="swap-balance">
        <span>{displaySymbol(data.currency)} 보유 자산</span>
        <span>{heldCurrency.toLocaleString()} {displaySymbol(data.currency)}</span>
      </div>

      <div className="storelist">
        {data.products.map((p) => {
          const result = results[p.id]
          return (
            <div className="storecard" key={p.id}>
              <div className="storecard-icon"><i className="ti ti-pill" aria-hidden="true"></i></div>
              <div className="storecard-body">
                <div className="storecard-name">{p.name}</div>
                <div className="storecard-desc">{p.description}</div>
                <div className="storecard-row">
                  <span className="storecard-price">{p.priceHhpc.toLocaleString()} {data.currency}</span>
                  <button className="storecard-buy" onClick={() => handleBuy(p)} disabled={buyingId === p.id}>
                    {buyingId === p.id ? '결제 중…' : '구매하기'}
                  </button>
                </div>
                {result?.ok && (
                  <p className="storecard-result">
                    {result.swap && (
                      <>{displaySymbol(result.swap.fromSymbol)} {result.swap.fromAmount.toLocaleString()}개를 자동 스왑한 뒤 </>
                    )}
                    {result.price.toLocaleString()} {displaySymbol(result.currency)} 결제를 전송했습니다.{' '}
                    <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="swap-txlink">
                      Etherscan <i className="ti ti-external-link" style={{ fontSize: 11 }} aria-hidden="true"></i>
                    </a>
                  </p>
                )}
                {result && !result.ok && <p className="storecard-error">{result.message}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {data.merchantAddress && (
        <p className="store-note">
          결제 대금은 판매자 주소 <code>{data.merchantAddress}</code>로 실제 전송됩니다.
        </p>
      )}
    </section>
  )
}

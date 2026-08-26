import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/index.js'
import { useApiData } from '../hooks/useApiData.js'
import { displaySymbol } from '../constants/coins.js'

const SORTS = [
  { id: 'recommend', label: '추천순' },
  { id: 'review', label: '리뷰순' },
  { id: 'low', label: '낮은가격순' },
  { id: 'high', label: '높은가격순' },
]

function sortProducts(products, sort) {
  // 'recommend' is the catalog's own order, so it must not be re-sorted.
  if (sort === 'recommend') return products
  const sorted = [...products]
  if (sort === 'review') sorted.sort((a, b) => b.reviews - a.reviews)
  if (sort === 'low') sorted.sort((a, b) => a.priceHhpc - b.priceHhpc)
  if (sort === 'high') sorted.sort((a, b) => b.priceHhpc - a.priceHhpc)
  return sorted
}

function discountPercent(product) {
  if (!product.listPriceHhpc) return null
  return Math.round((1 - product.priceHhpc / product.listPriceHhpc) * 100)
}

export default function StorePage() {
  const { data, error, retry } = useApiData(() => api.getStoreProducts())
  const [assets, setAssets] = useState(null)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recommend')
  const [results, setResults] = useState({})
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    api.getAssets().then(setAssets).catch(() => setAssets(null))
  }, [])

  const visible = useMemo(() => {
    if (!data) return []
    const inCategory = category === 'all' ? data.products : data.products.filter((p) => p.category === category)
    return sortProducts(inCategory, sort)
  }, [data, category, sort])

  if (error) {
    return (
      <div className="pageerror">
        <span>스토어 상품을 불러오지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.</span>
        <button type="button" onClick={retry}>다시 시도</button>
      </div>
    )
  }
  if (!data) return <div className="pageloading">불러오는 중…</div>

  const held = assets?.coins.find((c) => c.symbol === data.currency)?.balance ?? 0
  const label = displaySymbol(data.currency)

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
    <section className="panel storepanel">
      <div className="mallhero">
        <p className="mallhero-tag">{data.brandTagline}</p>
        <h2 className="mallhero-title">De Simone</h2>
        <p className="mallhero-sub">{data.brandSub}</p>
        <div className="mallhero-art" aria-hidden="true"></div>
      </div>

      <div className="mallbalance">
        <span>{label} 보유 자산</span>
        <span>{held.toLocaleString()} {label}</span>
      </div>

      <div className="malltabs" role="tablist">
        {data.categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            className={'malltab' + (category === c.id ? ' active' : '')}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mallsorts">
        {SORTS.map((s) => (
          <button
            key={s.id}
            className={'mallsort' + (sort === s.id ? ' active' : '')}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mallcount">총 {visible.length}개</p>

      <div className="mallgrid">
        {visible.map((p) => {
          const result = results[p.id]
          const off = discountPercent(p)
          const affordable = held >= p.priceHhpc
          return (
            <article className="mallcard" key={p.id}>
              <div className={`mallcard-thumb cat-${p.category}`}>
                {p.badge && <span className="mallcard-badge">{p.badge}</span>}
                {p.soldOut && <span className="mallcard-sold">SOLD OUT</span>}
                <i className="ti ti-vaccine-bottle" aria-hidden="true"></i>
              </div>

              <button
                className="mallcard-buy"
                onClick={() => handleBuy(p)}
                disabled={p.soldOut || buyingId === p.id || !affordable}
              >
                {buyingId === p.id
                  ? '결제 중…'
                  : p.soldOut
                    ? '품절'
                    : affordable
                      ? <><i className="ti ti-shopping-cart-plus" aria-hidden="true"></i> 구매하기</>
                      : `${label} 부족`}
              </button>

              {p.tags.length > 0 && (
                <p className="mallcard-tags">{p.tags.map((t) => `#${t}`).join(' ')}</p>
              )}
              <h3 className="mallcard-name">{p.name}</h3>

              {p.listPriceHhpc && (
                <p className="mallcard-list">{p.listPriceHhpc.toLocaleString()} {label}</p>
              )}
              <p className="mallcard-price">
                {off ? <span className="mallcard-off">{off}%</span> : null}
                <strong>{p.priceHhpc.toLocaleString()}</strong> {label}
              </p>

              {p.reviews > 0 && (
                <p className="mallcard-rating">
                  <i className="ti ti-star-filled" aria-hidden="true"></i> {p.rating}
                  <span> ({p.reviews.toLocaleString()})</span>
                </p>
              )}

              {result?.ok && (
                <p className="mallcard-result">
                  {result.swap && <>{displaySymbol(result.swap.fromSymbol)} 자동 스왑 후 </>}
                  결제 전송 완료{' '}
                  <a href={result.explorerUrl} target="_blank" rel="noreferrer" className="swap-txlink">
                    Etherscan <i className="ti ti-external-link" style={{ fontSize: 10 }} aria-hidden="true"></i>
                  </a>
                </p>
              )}
              {result && !result.ok && <p className="mallcard-err">{result.message}</p>}
            </article>
          )
        })}
      </div>

      {data.merchantAddress && (
        <p className="store-note">
          결제 대금은 {label}로 판매자 주소 <code>{data.merchantAddress}</code>로 실제 전송됩니다.
          1 {label} = 1 원 페그이므로 표시 금액과 원화 가격이 같습니다.
        </p>
      )}
    </section>
  )
}

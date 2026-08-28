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
  if (sort === 'low') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'high') sorted.sort((a, b) => b.price - a.price)
  return sorted
}

function discountPercent(product) {
  if (!product.listPrice) return null
  return Math.round((1 - product.price / product.listPrice) * 100)
}

function PurchaseModal({ receipt, label, onClose }) {
  const rewardPaid = receipt.reward?.status === 'submitted'
  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="buy-done" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-check"><i className="ti ti-check" aria-hidden="true"></i></div>
        <p className="modal-title" id="buy-done">구매 완료</p>
        <p className="modal-sub">{receipt.productName}</p>

        <div className="modal-lines">
          {receipt.swap && (
            <div>
              <span>{displaySymbol(receipt.swap.fromSymbol)} 자동 스왑</span>
              <span>{receipt.swap.fromAmount.toLocaleString()} → {receipt.swap.toAmount.toLocaleString()}</span>
            </div>
          )}
          <div>
            <span>결제 금액</span>
            <span>{receipt.price.toLocaleString()} {label}</span>
          </div>
          {rewardPaid && (
            <div className="reward">
              <span><i className="ti ti-gift" aria-hidden="true"></i> {Math.round(receipt.reward.rate * 100)}% 리워드 적립</span>
              <span>+{receipt.reward.amount.toLocaleString()} {label}</span>
            </div>
          )}
          {rewardPaid && (
            <div className="net">
              <span>실 결제</span>
              <span>{receipt.netPaid.toLocaleString()} {label}</span>
            </div>
          )}
        </div>

        {receipt.reward?.status === 'failed' && (
          <p className="modal-warn">
            리워드 {receipt.reward.amount.toLocaleString()} {label} 지급 실패 — {receipt.reward.error}
            <br />결제는 정상 완료되었습니다.
          </p>
        )}

        <div className="modal-links">
          <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
            결제 내역 <i className="ti ti-external-link" aria-hidden="true"></i>
          </a>
          {rewardPaid && (
            <a href={receipt.reward.explorerUrl} target="_blank" rel="noreferrer">
              적립 내역 <i className="ti ti-external-link" aria-hidden="true"></i>
            </a>
          )}
        </div>

        <button className="modal-btn" onClick={onClose} autoFocus>확인</button>
      </div>
    </div>
  )
}

export default function StorePage() {
  const { data, error, retry } = useApiData(() => api.getStoreProducts())
  const [assets, setAssets] = useState(null)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recommend')
  const [errors, setErrors] = useState({})
  const [receipt, setReceipt] = useState(null)
  const [buyingId, setBuyingId] = useState(null)

  useEffect(() => {
    api.getAssets().then(setAssets).catch(() => setAssets(null))
  }, [])

  // Escape closes the receipt, same as the scrim and the 확인 button.
  useEffect(() => {
    if (!receipt) return
    const onKey = (e) => { if (e.key === 'Escape') setReceipt(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [receipt])

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
    setErrors((e) => ({ ...e, [product.id]: null }))
    try {
      const res = await api.purchaseProduct(product.id)
      setReceipt(res)
      // Payment and reward are only submitted, not mined — give the block time
      // to land before reading the balance back.
      setTimeout(() => api.getAssets().then(setAssets).catch(() => {}), 8000)
    } catch (err) {
      setErrors((e) => ({ ...e, [product.id]: err.message }))
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <section className="panel">
      <h2 className="pagetitle">{data.brand}</h2>

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
          const failure = errors[p.id]
          const off = discountPercent(p)
          const affordable = held >= p.price
          return (
            <article className="mallcard" key={p.id}>
              <div className={`mallcard-thumb cat-${p.category}`}>
                {p.soldOut && <span className="mallcard-sold">SOLD OUT</span>}
                {p.image
                  ? <img src={p.image} alt={p.name} loading="lazy" />
                  : <i className="ti ti-vaccine-bottle" aria-hidden="true"></i>}
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

              {p.listPrice && (
                <p className="mallcard-list">{p.listPrice.toLocaleString()} {label}</p>
              )}
              <p className="mallcard-price">
                {off ? <span className="mallcard-off">{off}%</span> : null}
                <strong>{p.price.toLocaleString()}</strong> {label}
              </p>

              {data.rewardRate > 0 && (
                <p className="mallcard-reward">
                  <i className="ti ti-gift" aria-hidden="true"></i>
                  {Math.round(data.rewardRate * 100)}%({Math.floor(p.price * data.rewardRate).toLocaleString()} {label}) 적립
                </p>
              )}

              {p.reviews > 0 && (
                <p className="mallcard-rating">
                  <i className="ti ti-star-filled" aria-hidden="true"></i> {p.rating}
                  <span> ({p.reviews.toLocaleString()})</span>
                </p>
              )}

              {failure && <p className="mallcard-err">{failure}</p>}
            </article>
          )
        })}
      </div>

      {receipt && (
        <PurchaseModal receipt={receipt} label={label} onClose={() => setReceipt(null)} />
      )}
    </section>
  )
}

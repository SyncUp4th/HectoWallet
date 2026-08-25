import { useEffect, useRef, useState } from 'react'
import { displaySymbol } from '../constants/coins.js'

export default function TokenSelect({ coins, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = coins.filter(
    (c) => !query || c.symbol.toLowerCase().includes(query.toLowerCase()) || c.name.includes(query),
  )

  function pick(symbol) {
    onChange(symbol)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter' && filtered.length > 0) pick(filtered[0].symbol)
  }

  return (
    <div className="tokenpick" ref={rootRef}>
      <button
        type="button"
        className="tokenselect"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dot" style={{ background: `var(--c-${value.toLowerCase()})` }}></span>
        {displaySymbol(value)}
        <i className="ti ti-chevron-down" style={{ fontSize: 13 }} aria-hidden="true"></i>
      </button>

      {open && (
        <div className="tokenpick-panel">
          <input
            autoFocus
            className="tokenpick-search"
            placeholder="심볼 또는 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <ul className="tokenpick-list" role="listbox">
            {filtered.map((c) => (
              <li key={c.symbol}>
                <button
                  type="button"
                  className={'tokenpick-item' + (c.symbol === value ? ' active' : '')}
                  onClick={() => pick(c.symbol)}
                  role="option"
                  aria-selected={c.symbol === value}
                >
                  <span className="dot" style={{ background: `var(--c-${c.symbol.toLowerCase()})` }}></span>
                  <span>{displaySymbol(c.symbol)}</span>
                  <span className="tokenpick-name">{c.name}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="tokenpick-empty">검색 결과 없음</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

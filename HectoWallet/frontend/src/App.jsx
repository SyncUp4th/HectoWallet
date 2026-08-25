import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { COINS, displaySymbol } from './constants/coins.js'
import AssetsPage from './pages/AssetsPage.jsx'
import SwapPage from './pages/SwapPage.jsx'
import ExplorerPage from './pages/ExplorerPage.jsx'
import SettlementPage from './pages/SettlementPage.jsx'

const TABS = [
  { to: '/assets', label: '자산', icon: 'ti-wallet' },
  { to: '/swap', label: '스왑', icon: 'ti-arrows-exchange' },
  { to: '/explorer', label: '거래내역', icon: 'ti-receipt-2' },
  { to: '/settlement', label: '정산', icon: 'ti-building-bank' },
]

export default function App() {
  return (
    <div className="app">
      <h1 className="sr-only">HectoWallet — 그룹사 코인 지갑, 스왑, 거래내역, 정산</h1>

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div className="brand-name">HectoWallet</div>
        </div>
        <div className="ticker-legend">
          {COINS.map((c) => (
            <span
              key={c.symbol}
              className="tick"
              style={{ background: `var(--c-${c.symbol.toLowerCase()}-bg)`, color: `var(--c-${c.symbol.toLowerCase()})` }}
            >
              {displaySymbol(c.symbol)}
            </span>
          ))}
        </div>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/assets" replace />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/settlement" element={<SettlementPage />} />
      </Routes>

      <nav className="bottomnav" role="tablist" aria-label="주요 메뉴">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => 'navitem' + (isActive ? ' active' : '')}>
            <i className={`ti ${t.icon}`} aria-hidden="true"></i>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

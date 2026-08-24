import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { COINS } from './constants/coins.js'
import AssetsPage from './pages/AssetsPage.jsx'
import SwapPage from './pages/SwapPage.jsx'
import ExplorerPage from './pages/ExplorerPage.jsx'
import SettlementPage from './pages/SettlementPage.jsx'

const TABS = [
  { to: '/assets', label: '자산' },
  { to: '/swap', label: '스왑' },
  { to: '/explorer', label: '트랜잭션 탐색기' },
  { to: '/settlement', label: '정산' },
]

export default function App() {
  return (
    <div className="app">
      <h1 className="sr-only">HectoWallet — 그룹사 코인 지갑, 스왑, 트랜잭션 탐색, 정산</h1>

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
              {c.symbol}
            </span>
          ))}
        </div>
      </div>

      <nav className="tabbar" role="tablist">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => 'tabbtn' + (isActive ? ' active' : '')}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/assets" replace />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/settlement" element={<SettlementPage />} />
      </Routes>
    </div>
  )
}

import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AssetsPage from './pages/AssetsPage.jsx'
import SwapPage from './pages/SwapPage.jsx'
import ExplorerPage from './pages/ExplorerPage.jsx'
import StorePage from './pages/StorePage.jsx'
import SettlementPage from './pages/SettlementPage.jsx'

const TABS = [
  { to: '/assets', label: '자산', icon: 'ti-wallet' },
  { to: '/swap', label: '스왑', icon: 'ti-arrows-exchange' },
  { to: '/explorer', label: '거래내역', icon: 'ti-receipt-2' },
  { to: '/store', label: '스토어', icon: 'ti-shopping-bag' },
]

// The mobile app shell (topbar + bottom nav) wraps only the phone-sized
// screens. Settlement is a PC-only back-office page, so it renders outside
// this shell entirely — see the routes below.
function MobileShell() {
  return (
    <div className="app">
      <h1 className="sr-only">HectoWallet — 그룹사 코인 지갑, 스왑, 거래내역, 스토어</h1>

      <div className="topbar">
        <div className="brand">
          <img src="/brand-icon.png" alt="" className="brand-mark" />
          <div className="brand-name">HectoWallet</div>
        </div>
      </div>

      <Outlet />

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

export default function App() {
  return (
    <Routes>
      <Route element={<MobileShell />}>
        <Route path="/" element={<Navigate to="/assets" replace />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/store" element={<StorePage />} />
      </Route>
      <Route path="/settlement" element={<SettlementPage />} />
    </Routes>
  )
}

import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useStore } from './store'

const Dashboard     = lazy(() => import('./pages/Dashboard'))
const WaterQuality  = lazy(() => import('./pages/WaterQuality'))
const HabOracle     = lazy(() => import('./pages/HabOracle'))
const Sensors       = lazy(() => import('./pages/Sensors'))
const WetlandAI     = lazy(() => import('./pages/WetlandAI'))

function Skeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const NAV_LINKS = [
  { to: '/',             label: 'Dashboard',     icon: '🌊' },
  { to: '/water',        label: 'Water Quality', icon: '💧' },
  { to: '/hab-oracle',   label: 'HAB Oracle',    icon: '🔬' },
  { to: '/sensors',      label: 'Sensors',       icon: '📡' },
  { to: '/wetland-ai',   label: 'WetlandAI',     icon: '🌿' },
]

function Sidebar() {
  return (
    <aside style={{ width: 220, minHeight: '100vh', backgroundColor: '#0f1318', borderRight: '1px solid #1e293b' }}
      className="flex flex-col p-4 gap-1 flex-shrink-0">
      <div className="mb-6 px-2">
        <div className="text-xs font-mono tracking-widest" style={{ color: '#38bdf8' }}>TERRAWATCH</div>
        <div className="text-xs" style={{ color: '#64748b', marginTop: 2 }}>Environmental Intelligence</div>
      </div>
      {NAV_LINKS.map(l => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors no-underline ${
              isActive
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }>
          <span>{l.icon}</span>{l.label}
        </NavLink>
      ))}
      <div className="mt-auto pt-4" style={{ borderTop: '1px solid #1e293b' }}>
        <div className="text-xs px-2" style={{ color: '#475569' }}>Mobile Bay, Alabama</div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#0a0d12' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<Skeleton />}>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/water"      element={<WaterQuality />} />
              <Route path="/hab-oracle" element={<HabOracle />} />
              <Route path="/sensors"    element={<Sensors />} />
              <Route path="/wetland-ai" element={<WetlandAI />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  )
}

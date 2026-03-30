import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../store/index.js'
import clsx from 'clsx'

const NAV = [
  { path: '/', label: 'Dashboard', icon: '◎', exact: true },
  { path: '/hab-oracle', label: 'HAB Oracle', icon: '⬡', badge: 'WORLD FIRST' },
  { path: '/hypoxia', label: 'Hypoxia Forecast', icon: '〇', badge: 'WORLD FIRST' },
  { path: '/water-quality', label: 'Water Quality', icon: '≋' },
  { path: '/map', label: 'Satellite Map', icon: '🛰️' },
  { path: '/science', label: 'Science View', icon: '⬢', badge: 'SCIENTIST' },
  { path: '/intelligence', label: 'Intelligence', icon: '◈', badge: 'ML' },
  { path: '/sensors', label: 'Sensor Registry', icon: '⊞' },
  { path: '/feeds', label: 'Feed Status', icon: '◉' },
  null,
  { path: '/wetlandai', label: 'WetlandAI', icon: '◈', badge: 'WORLD FIRST' },
  { path: '/sitevault', label: 'SITEVAULT', icon: '⊟' },
  null,
  { path: '/alerts', label: 'Alert Center', icon: '◉' },
  { path: '/ai-assistant', label: 'AI Field Assistant', icon: '◇' },
  { path: '/ml-architecture', label: 'ML Architecture v2', icon: '⬢', badge: 'RESEARCH' },
  { path: '/vision', label: 'Vision', icon: '★' },
]

export default function Layout() {
  const { lastUpdated, liveMode, toggleLiveMode, alerts, loading } = useStore()
  const isLoading = Object.values(loading).some(Boolean)

  const fmt = ts => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#eef6f2' }}>
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-bay-100 bg-white overflow-y-auto">
        <div className="px-4 py-5 border-b border-bay-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0a9e80,#1a7a3c)' }}>
              <span className="text-white text-xs font-bold tw-mono">TW</span>
            </div>
            <div>
              <div className="text-bay-900 font-bold text-sm leading-none" style={{ fontFamily: 'Syne,sans-serif' }}>
                TERRAWATCH
              </div>
              <div className="tw-label text-[8px] mt-0.5">Mobile Bay · Gulf Coast</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {isLoading
                ? <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                : <div className="live-dot" />}
              <span className="tw-mono text-[9px] text-bay-400">
                {isLoading ? 'POLLING...' : 'LIVE'}
              </span>
            </div>
            <button onClick={toggleLiveMode}
              className={clsx('tw-mono text-[8px] px-1.5 py-0.5 rounded border transition-colors',
                liveMode
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : 'border-bay-200 bg-bay-50 text-bay-400')}>
              {liveMode ? 'AUTO' : 'MANUAL'}
            </button>
          </div>
          {lastUpdated && (
            <div className="tw-mono text-[8px] text-bay-300 mt-1">
              {fmt(lastUpdated)}
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-3">
          {NAV.map((item, i) => {
            if (!item) return <div key={i} className="h-px bg-bay-100 my-2 mx-2" />
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5',
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-bay-500 hover:bg-bay-50 hover:text-bay-700')
                }>
                <span className="text-base opacity-70">{item.icon}</span>
                <span className="flex-1 leading-tight">{item.label}</span>
                {item.badge && (
                  <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100 text-teal-700 font-bold leading-none">
                    ★
                  </span>
                )}
                {item.path === '/alerts' && alerts.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-bay-100">
          <div className="tw-label text-[8px] text-bay-300 leading-relaxed">
            Built in Fairhope, AL<br />
            12 min from Weeks Bay<br />
            Hansen Holdings LLC
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

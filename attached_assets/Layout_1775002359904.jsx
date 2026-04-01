import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../store/index.js'
import clsx from 'clsx'
import {
  LayoutDashboard, FlaskConical, Waves, Droplets, Satellite,
  Microscope, Brain, Radio, Activity, TreePine, Database,
  Bell, Bot, Cpu, Sparkles, Map as MapIcon, Gauge
} from 'lucide-react'

const NAV = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { path: '/hab-oracle', label: 'HAB Oracle', Icon: FlaskConical, badge: 'WORLD FIRST' },
  { path: '/hypoxia', label: 'Hypoxia Forecast', Icon: Waves, badge: 'WORLD FIRST' },
  { path: '/water-quality', label: 'Water Quality', Icon: Droplets },
  { path: '/map', label: 'Satellite Map', Icon: Satellite },
  { path: '/science', label: 'Science View', Icon: Microscope, badge: 'SCIENTIST' },
  { path: '/data-stream', label: 'Data Stream', Icon: Gauge, badge: '141 KEYS' },
  { path: '/intelligence', label: 'Intelligence', Icon: Brain, badge: 'ML' },
  { path: '/sensors', label: 'Sensor Registry', Icon: Radio },
  { path: '/feeds', label: 'Feed Status', Icon: Activity },
  null,
  { path: '/wetlandai', label: 'WetlandAI', Icon: TreePine, badge: 'WORLD FIRST' },
  { path: '/sitevault', label: 'SITEVAULT', Icon: Database },
  null,
  { path: '/alerts', label: 'Alert Center', Icon: Bell },
  { path: '/ai-assistant', label: 'AI Field Assistant', Icon: Bot },
  { path: '/ml-architecture', label: 'ML Architecture v2', Icon: Cpu, badge: 'RESEARCH' },
  { path: '/vision', label: 'Vision', Icon: Sparkles },
  { path: '/roadmap', label: 'Master Roadmap', Icon: MapIcon, badge: 'STRATEGY' },
]

export default function Layout() {
  const { lastUpdated, liveMode, toggleLiveMode, alerts, loading } = useStore()
  const isLoading = Object.values(loading).some(Boolean)

  const fmt = ts => ts ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col tw-glass-sidebar overflow-y-auto">
        <div className="px-4 py-5 border-b border-white/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
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
              className={clsx('tw-mono text-[8px] px-1.5 py-0.5 rounded border transition-colors backdrop-blur-sm',
                liveMode
                  ? 'border-teal-200/60 bg-teal-50/70 text-teal-700'
                  : 'border-bay-200/60 bg-bay-50/70 text-bay-400')}>
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
            if (!item) return <div key={i} className="h-px bg-bay-100/50 my-2 mx-2" />
            const { Icon } = item
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5',
                    isActive
                      ? 'bg-teal-50/80 text-teal-800 font-semibold shadow-sm backdrop-blur-sm'
                      : 'text-bay-500 hover:bg-white/40 hover:text-bay-700')
                }>
                <Icon size={16} className="opacity-70 flex-shrink-0" />
                <span className="flex-1 leading-tight">{item.label}</span>
                {item.badge && (
                  <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100/70 text-teal-700 font-bold leading-none backdrop-blur-sm">
                    ★
                  </span>
                )}
                {item.path === '/alerts' && alerts.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
                    {alerts.length}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/30">
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

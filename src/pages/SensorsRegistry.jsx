import { useEffect } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, Section } from '../components/Common/index.jsx'
import clsx from 'clsx'

export default function SensorsRegistry() {
  const { sensors, fetchSensors, loading } = useStore()

  useEffect(() => { fetchSensors() }, [])

  const registry = sensors?.sensors || []
  const summary = sensors?.summary || {}

  return (
    <div className="p-6 max-w-6xl animate-in">
      <PageHeader icon="⊞" title="Sensor Registry" subtitle={`${summary.total || '—'} total sensors · ${summary.active || '—'} active · ${summary.worldFirsts || '—'} world firsts`} />

      <Section title="Active Sensors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {registry.filter(s => s.status === 'active').map(s => (
            <div key={s.id} className="tw-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="font-semibold text-sm text-bay-800">{s.name}</div>
                {s.worldFirst && <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">★</span>}
              </div>
              <div className="text-xs text-bay-400 mb-1">{s.type} · {s.feeds} feeds · {s.cost}</div>
              <div className="tw-mono text-[9px] text-bay-300">Auth: {s.auth}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Required">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {registry.filter(s => s.status === 'key_required').map(s => (
            <div key={s.id} className="tw-card border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <div className="font-semibold text-sm text-bay-800">{s.name}</div>
              </div>
              <div className="text-xs text-bay-400 mb-1">{s.type} · {s.feeds} feeds</div>
              <div className="tw-mono text-[9px] text-blue-600">{s.auth}</div>
            </div>
          ))}
        </div>
      </Section>

      {sensors?.envRequired && (
        <Section title="Environment Variables">
          <div className="tw-card">
            {sensors.envRequired.map(e => (
              <div key={e.key} className="flex items-center gap-3 py-2 border-b border-bay-50 last:border-0">
                <code className="tw-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{e.key}</code>
                <span className="text-xs text-bay-500 flex-1">{e.desc}</span>
                <a href={`https://${e.register}`} target="_blank" rel="noreferrer" className="text-[10px] text-teal-600 hover:underline">{e.register}</a>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

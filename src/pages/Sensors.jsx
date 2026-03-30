import { useState, useEffect } from 'react'

const API = '/api'

const STATUS_COLORS = {
  active: '#34d399',
  pending_integration: '#fbbf24',
  evaluation: '#38bdf8',
  partnership: '#a78bfa',
}

function statusColor(status) {
  if (status.startsWith('active')) return STATUS_COLORS.active
  if (status.startsWith('pending')) return STATUS_COLORS.pending_integration
  if (status.startsWith('planned')) return '#475569'
  if (status === 'evaluation') return STATUS_COLORS.evaluation
  if (status === 'partnership') return STATUS_COLORS.partnership
  return '#475569'
}

export default function Sensors() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/sensors/registry`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📡 Sensor Registry</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Data feeds and monitoring integrations
        </p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', val: data.summary.total, color: '#94a3b8' },
            { label: 'Active', val: data.summary.active, color: '#34d399' },
            { label: 'Pending', val: data.summary.pending, color: '#fbbf24' },
            { label: 'World Firsts', val: data.summary.worldFirsts, color: '#a78bfa' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-14 animate-pulse" style={{ backgroundColor: '#0f1318' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.sensors?.map(sensor => (
            <div key={sensor.id} className="card p-4 flex items-start gap-3">
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor(sensor.status), flexShrink: 0, marginTop: 4 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{sensor.name}</span>
                  {sensor.worldFirst && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#3b1f82', color: '#c4b5fd' }}>
                      World First™
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                    {sensor.type}
                  </span>
                  <span className="text-xs" style={{ color: statusColor(sensor.status) }}>
                    {sensor.status.replace(/_/g, ' ')}
                  </span>
                  {sensor.feeds > 0 && (
                    <span className="text-xs" style={{ color: '#475569' }}>{sensor.feeds} feeds</span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono flex-shrink-0" style={{ color: '#475569' }}>{sensor.cost}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

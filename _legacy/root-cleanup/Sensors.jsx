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
        <h1 className="text-2xl font-bold text-bay-900">📡 Sensor Registry</h1>
        <p className="text-sm mt-1 text-bay-500">
          Data feeds and monitoring integrations
        </p>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', val: data.summary.total, color: '#64748b' },
            { label: 'Active', val: data.summary.active, color: '#059669' },
            { label: 'Pending', val: data.summary.pending, color: '#d97706' },
            { label: 'World Firsts', val: data.summary.worldFirsts, color: '#7c3aed' },
          ].map(({ label, val, color }) => (
            <div key={label} className="tw-card p-4 text-center">
              <div className="text-2xl font-bold" style={{ color }}>{val}</div>
              <div className="text-xs mt-1 text-bay-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="tw-card h-14 animate-pulse bg-bay-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.sensors?.map(sensor => (
            <div key={sensor.id} className="tw-card p-4 flex items-start gap-3">
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor(sensor.status), flexShrink: 0, marginTop: 4 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-bay-800">{sensor.name}</span>
                  {sensor.worldFirst && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-purple-100 text-purple-700">
                      World First™
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-bay-100 text-bay-500">
                    {sensor.type}
                  </span>
                  <span className="text-xs" style={{ color: statusColor(sensor.status) }}>
                    {sensor.status.replace(/_/g, ' ')}
                  </span>
                  {sensor.feeds > 0 && (
                    <span className="text-xs text-bay-400">{sensor.feeds} feeds</span>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono flex-shrink-0 text-bay-400">{sensor.cost}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

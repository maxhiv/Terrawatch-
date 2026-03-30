import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const API = '/api'

function StatCard({ title, value, unit, status, icon }) {
  const statusColor = status === 'ok' ? '#34d399' : status === 'warn' ? '#fbbf24' : '#94a3b8'
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono" style={{ color: '#64748b' }}>{title}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold" style={{ color: statusColor }}>
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {unit && <span className="text-xs" style={{ color: '#64748b' }}>{unit}</span>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [health, setHealth] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, wRes] = await Promise.allSettled([
          fetch(`${API}/health`).then(r => r.json()),
          fetch(`${API}/weather/current`).then(r => r.json()),
        ])
        if (hRes.status === 'fulfilled') setHealth(hRes.value)
        if (wRes.status === 'fulfilled') setWeather(wRes.value)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const cur = weather?.current || {}

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">🌊 TERRAWATCH</h1>
        <p className="text-sm" style={{ color: '#64748b' }}>
          Planetary Environmental Intelligence — Mobile Bay & Gulf Coast
        </p>
      </div>

      {health && (
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-md" style={{ backgroundColor: '#0f2418', border: '1px solid #166534', color: '#4ade80' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
          System {health.status} — v{health.version} — {new Date(health.timestamp).toLocaleTimeString()}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="TEMPERATURE" value={cur.temp_f ? cur.temp_f.toFixed(1) : null} unit="°F" status="ok" icon="🌡️" />
        <StatCard title="WIND SPEED" value={cur.wind_speed_mph ? cur.wind_speed_mph.toFixed(1) : null} unit="mph" status="ok" icon="💨" />
        <StatCard title="HUMIDITY" value={cur.humidity ? cur.humidity.toFixed(0) : null} unit="%" status="ok" icon="💧" />
        <StatCard title="PRESSURE" value={cur.pressure_mb ? cur.pressure_mb.toFixed(1) : null} unit="mb" status="ok" icon="📊" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Current Conditions</h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: '#1e293b' }} />)}
            </div>
          ) : weather ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Description</span>
                <span className="text-white">{cur.description || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Wind Direction</span>
                <span className="text-white">{cur.wind_direction ? `${cur.wind_direction}°` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Last Updated</span>
                <span className="text-white">{cur.timestamp ? new Date(cur.timestamp).toLocaleTimeString() : '—'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#64748b' }}>Weather data unavailable</p>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-white mb-3">7-Day Forecast</h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-4 rounded animate-pulse" style={{ backgroundColor: '#1e293b' }} />)}
            </div>
          ) : weather?.forecast ? (
            <div className="space-y-1">
              {weather.forecast.slice(0, 4).map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span style={{ color: '#94a3b8' }}>{p.name}</span>
                  <span className="text-white truncate max-w-[60%] text-right">{p.shortForecast}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#64748b' }}>Forecast unavailable</p>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-white mb-3">Active Data Sources</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'USGS NWIS', desc: 'Water Quality', status: true },
            { name: 'NOAA CO-OPS', desc: 'Tidal Data', status: true },
            { name: 'NOAA NWS', desc: 'Weather', status: true },
            { name: 'NOAA NDBC', desc: 'Buoy Data', status: true },
          ].map(src => (
            <div key={src.name} className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: '#0a0d12' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: src.status ? '#34d399' : '#ef4444', flexShrink: 0, marginTop: 4 }} />
              <div>
                <div className="text-xs font-semibold text-white">{src.name}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{src.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

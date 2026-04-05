import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { PageHeader, Spinner, Section } from '../components/Common/index.jsx'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = '/api/datasources'

const RISK_COLORS = {
  MINIMAL:  '#10b981',
  LOW:      '#34d399',
  MODERATE: '#fbbf24',
  ELEVATED: '#f97316',
  CRITICAL: '#dc2626',
}

const CATEGORY_META = {
  UPSTREAM:    { label: 'Upstream Hydrology',   color: '#3b82f6', icon: '〜' },
  IN_BAY:      { label: 'In-Bay Observations',  color: '#0ea5e9', icon: '◈' },
  DOWNSTREAM:  { label: 'Downstream / Offshore', color: '#06b6d4', icon: '≋' },
  ATMOSPHERIC: { label: 'Atmospheric',           color: '#8b5cf6', icon: '☁' },
  HUMAN:       { label: 'Human Activity',        color: '#f59e0b', icon: '⊞' },
}

const GAUGE_BANDS = [
  { max: 25,  color: RISK_COLORS.LOW,      label: 'LOW' },
  { max: 50,  color: RISK_COLORS.MODERATE,  label: 'MODERATE' },
  { max: 75,  color: RISK_COLORS.ELEVATED,  label: 'ELEVATED' },
  { max: 100, color: RISK_COLORS.CRITICAL,  label: 'CRITICAL' },
]

function dedupFlagArray(flags) {
  const seen = new Set()
  return flags.filter(f => {
    const ts = new Date(f.timestamp).getTime()
    const key = `${f.flag}|${f.source_id}|${Math.floor(ts / 3600000)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function RiskGauge({ score, level }) {
  const color = RISK_COLORS[level] || '#94a3b8'
  const pct = Math.min(100, Math.max(0, score))
  const arcLen = 251
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 220, height: 130 }}>
        <svg width="220" height="130" viewBox="0 0 220 130">
          {GAUGE_BANDS.map((band, i) => {
            const start = (i === 0 ? 0 : GAUGE_BANDS[i - 1].max) / 100
            const end = band.max / 100
            const segLen = (end - start) * arcLen
            const offset = start * arcLen
            return (
              <path key={i}
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke={band.color}
                strokeWidth="10"
                strokeLinecap="butt"
                strokeDasharray={`${segLen} ${arcLen - segLen}`}
                strokeDashoffset={-offset}
                opacity={0.25}
              />
            )
          })}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * arcLen} ${arcLen}`}
          />
          <text x="110" y="95" textAnchor="middle" fill={color} fontSize="36" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
            {score}
          </text>
          <text x="110" y="118" textAnchor="middle" fill={color} fontSize="12" fontFamily="JetBrains Mono, monospace">
            {level}
          </text>
          <text x="20" y="126" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">0</text>
          <text x="200" y="126" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">100</text>
        </svg>
      </div>
    </div>
  )
}

function MiniSparkline({ data, color = '#0ea5e9', width = 80, height = 24 }) {
  if (!data?.length || data.length < 2) return null
  const vals = data.map(d => (typeof d === 'number' ? d : d.v)).filter(v => v != null && Number.isFinite(v))
  if (vals.length < 2) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const points = vals.map((v, i) => `${(i / (vals.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`).join(' ')
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function getSourceHealth(snapshot) {
  if (snapshot.error) return { status: 'error', color: 'bg-red-500', badgeCls: 'bg-red-100 text-red-700', label: 'Error' }
  if (!snapshot.timestamp) return { status: 'offline', color: 'bg-amber-400', badgeCls: 'bg-amber-100 text-amber-700', label: 'Offline' }
  const ageMs = Date.now() - new Date(snapshot.timestamp).getTime()
  const pollMs = (snapshot.poll_interval_min || 15) * 60 * 1000
  if (ageMs > pollMs * 3) return { status: 'offline', color: 'bg-amber-400', badgeCls: 'bg-amber-100 text-amber-700', label: 'Offline' }
  return { status: 'online', color: 'bg-emerald-500', badgeCls: 'bg-emerald-100 text-emerald-700', label: 'Online' }
}

function SourceCard({ snapshot, onRefresh, onToggleHistory, isRefreshing, sparkData }) {
  const catMeta = CATEGORY_META[snapshot.category] || { label: snapshot.category, color: '#6b7280', icon: '?' }
  const flags = Array.isArray(snapshot.flags) ? snapshot.flags : []
  const age = snapshot.timestamp ? timeAgo(new Date(snapshot.timestamp).getTime()) : null
  const health = getSourceHealth(snapshot)

  const keyReadings = extractKeyReadings(snapshot)

  return (
    <div className="tw-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0', health.color, health.status === 'online' && 'animate-pulse')} />
          <div>
            <div className="text-sm font-semibold text-bay-800">{snapshot.label}</div>
            <div className="tw-mono text-[9px] text-bay-300">{snapshot.source_id}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={clsx('tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold', health.badgeCls)}>
            {health.label}
          </span>
          <button onClick={onRefresh} disabled={isRefreshing} className="tw-mono text-[9px] px-1.5 py-0.5 rounded bg-bay-50 text-bay-500 hover:bg-bay-100 transition-colors disabled:opacity-50" title="Refresh">
            {isRefreshing ? <Spinner size={10} /> : '↺'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2 text-[10px] text-bay-400 flex-wrap">
        <span style={{ color: catMeta.color }} className="font-semibold">{catMeta.icon} {catMeta.label}</span>
        {snapshot.provider && <span className="text-bay-500">{snapshot.provider}</span>}
        {snapshot.poll_interval_min && <span>⟳ {snapshot.poll_interval_min}min</span>}
        {age && <span>Updated {age}</span>}
        {snapshot.elapsed_ms != null && <span>{snapshot.elapsed_ms}ms</span>}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {keyReadings.length > 0 && keyReadings.map((r, i) => (
            <div key={i} className="tw-mono text-xs px-1.5 py-0.5 rounded bg-bay-50 text-bay-700">
              <span className="text-bay-400 text-[9px]">{r.label}:</span> <span className="font-bold">{r.value}</span>
              {r.unit && <span className="text-bay-300 text-[9px] ml-0.5">{r.unit}</span>}
            </div>
          ))}
        </div>
        <MiniSparkline data={sparkData} color={catMeta.color} />
      </div>

      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {flags.slice(0, 4).map((f, i) => {
            const flagName = typeof f === 'string' ? f : f.flag
            return (
              <span key={i} className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                {flagName}
              </span>
            )
          })}
          {flags.length > 4 && (
            <span className="tw-mono text-[8px] text-bay-400">+{flags.length - 4} more</span>
          )}
        </div>
      )}

      {snapshot.error && (
        <div className="tw-mono text-[9px] text-red-600 bg-red-50 rounded p-1.5 mb-2 truncate">
          {snapshot.error}
        </div>
      )}

      <button onClick={onToggleHistory} className="tw-mono text-[9px] text-teal-600 hover:text-teal-800 transition-colors">
        ▸ View History
      </button>
    </div>
  )
}

function HistoryPanel({ sourceId, label, onClose }) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/${sourceId}/history?hours=72`)
      .then(r => r.json())
      .then(d => { setHistory(d.history || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sourceId])

  const chartData = [...(history || [])].reverse().map(h => {
    const readings = extractNumericFromSnapshot(h)
    return {
      time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      ...readings,
    }
  })

  const metricKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(k => k !== 'time' && typeof chartData[0][k] === 'number') : []
  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#dc2626']

  return (
    <div className="tw-card mb-4 border-l-4" style={{ borderLeftColor: '#0ea5e9' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="tw-label text-blue-600">{label} — 72h History</div>
        <button onClick={onClose} className="text-bay-400 hover:text-bay-600 text-sm">✕</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Spinner size={24} /></div>
      ) : chartData.length > 0 && metricKeys.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 8, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
            <Tooltip contentStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            {metricKeys.slice(0, 3).map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} name={key} stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]} fillOpacity={0.1} strokeWidth={1.5} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-bay-400 text-xs py-6">No history data available</div>
      )}
      {history && (
        <div className="tw-mono text-[9px] text-bay-300 mt-2">{history.length} snapshots</div>
      )}
    </div>
  )
}

function FlagsList({ flags }) {
  if (!flags?.length) return <div className="text-xs text-bay-400 py-4">No active risk flags</div>

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto">
      {flags.slice(0, 30).map((f, i) => {
        const severity = flagSeverity(f.flag)
        return (
          <div key={i} className={clsx('flex items-center gap-2 px-2 py-1.5 rounded text-xs',
            severity === 'critical' ? 'bg-red-50' : severity === 'high' ? 'bg-amber-50' : 'bg-bay-50'
          )}>
            <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
              severity === 'critical' ? 'bg-red-500' : severity === 'high' ? 'bg-amber-500' : 'bg-blue-400'
            )} />
            <span className={clsx('tw-mono font-bold text-[10px]',
              severity === 'critical' ? 'text-red-700' : severity === 'high' ? 'text-amber-700' : 'text-bay-600'
            )}>
              {f.flag}
            </span>
            <span className="text-bay-400 text-[9px] flex-1">{f.source_id}</span>
            {f.timestamp && (
              <span className="tw-mono text-[8px] text-bay-300">{timeAgo(new Date(f.timestamp).getTime())}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DataSources() {
  const [registry, setRegistry] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [riskScore, setRiskScore] = useState(null)
  const [riskFlags, setRiskFlags] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSource, setExpandedSource] = useState(null)
  const [refreshing, setRefreshing] = useState(null)
  const [sparkHistory, setSparkHistory] = useState({})
  const [sseConnected, setSseConnected] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setLoading(true)
    try {
      const [regRes, latestRes, riskRes] = await Promise.all([
        fetch(API).then(r => r.json()),
        fetch(`${API}/latest`).then(r => r.json()),
        fetch(`${API}/risk/score`).then(r => r.json()),
      ])
      const sources = regRes.sources || []
      setRegistry(sources)
      setSnapshots(latestRes.snapshots || [])
      setRiskFlags(dedupFlagArray(latestRes.active_flags || []))
      setRiskScore(riskRes)
      for (const src of sources) {
        fetch(`${API}/${src.id}/history?hours=6`)
          .then(r => r.json())
          .then(d => {
            const hist = d.history || []
            const vals = hist.map(h => {
              const nums = extractNumericFromSnapshot(h)
              const first = Object.values(nums)[0]
              return first
            }).filter(v => v != null && Number.isFinite(v))
            if (vals.length >= 2) {
              setSparkHistory(prev => ({ ...prev, [src.id]: vals.reverse() }))
            }
          })
          .catch(() => {})
      }
    } catch (err) {
      console.error('[DataSources] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const es = new EventSource(`${API}/stream`)
    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)

    es.addEventListener('source_update', (e) => {
      try {
        const snap = JSON.parse(e.data)
        setSnapshots(prev => {
          const idx = prev.findIndex(s => s.source_id === snap.source_id)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = snap
            return updated
          }
          return [...prev, snap]
        })
      } catch {}
    })

    es.addEventListener('source_error', (e) => {
      try {
        const err = JSON.parse(e.data)
        if (err.source_id) {
          setSnapshots(prev => {
            const idx = prev.findIndex(s => s.source_id === err.source_id)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], error: err.error || 'Unknown error', timestamp: new Date().toISOString() }
              return updated
            }
            return [...prev, { source_id: err.source_id, error: err.error || 'Unknown error', timestamp: new Date().toISOString() }]
          })
        }
      } catch {}
    })

    es.addEventListener('flags_raised', (e) => {
      try {
        const ev = JSON.parse(e.data)
        if (Array.isArray(ev.flags)) {
          const newFlags = ev.flags.map(f => ({
            flag: typeof f === 'string' ? f : f.flag,
            source_id: ev.source_id,
            timestamp: new Date().toISOString(),
          }))
          setRiskFlags(prev => {
            const merged = [...newFlags, ...prev]
            return dedupFlagArray(merged).slice(0, 100)
          })
        }
      } catch {}
    })

    es.addEventListener('snapshot', (e) => {
      try {
        const snap = JSON.parse(e.data)
        if (snap.hab_risk_score != null) {
          const s = snap.hab_risk_score
          const lvl = s >= 76 ? 'CRITICAL' : s >= 51 ? 'ELEVATED' : s >= 26 ? 'MODERATE' : 'LOW'
          setRiskScore(prev => prev
            ? { ...prev, score: s, level: lvl }
            : { score: s, level: lvl }
          )
        }
        if (Array.isArray(snap.risk_flags)) {
          setRiskFlags(dedupFlagArray(snap.risk_flags))
        }
      } catch {}
    })

    return () => es.close()
  }, [])

  const handleRefresh = async (sourceId) => {
    setRefreshing(sourceId)
    try {
      const res = await fetch(`${API}/${sourceId}/refresh`, { method: 'POST' })
      const data = await res.json()
      if (data.snapshot) {
        setSnapshots(prev => {
          const idx = prev.findIndex(s => s.source_id === sourceId)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = data.snapshot
            return updated
          }
          return [...prev, data.snapshot]
        })
      }
    } catch (err) {
      console.error('[DataSources] Refresh error:', err)
    } finally {
      setRefreshing(null)
    }
  }

  const snapshotMap = {}
  for (const s of snapshots) snapshotMap[s.source_id] = s

  const regMap = {}
  for (const r of registry) regMap[r.id] = r

  const grouped = {}
  for (const source of registry) {
    const snap = snapshotMap[source.id]
    const cat = snap?.category || source.category || 'OTHER'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({
      ...source,
      source_id: source.id,
      provider: source.provider,
      poll_interval_min: source.poll_interval_min,
      ...(snap || {}),
    })
  }

  const allMerged = Object.values(grouped).flat()
  const onlineCount = allMerged.filter(s => getSourceHealth(s).status === 'online').length
  const offlineCount = allMerged.filter(s => getSourceHealth(s).status === 'offline').length
  const errorCount = allMerged.filter(s => getSourceHealth(s).status === 'error').length
  const totalFlags = riskFlags.length

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="◉"
        title="Data Sources"
        subtitle={`9 live sources · ${onlineCount} online · ${totalFlags} active flags`}
        badge="LIVE"
        actions={
          <div className="flex items-center gap-2">
            <span className={clsx('tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold',
              sseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            )}>
              SSE {sseConnected ? 'LIVE' : 'CONNECTING'}
            </span>
            <button onClick={() => fetchData(true)} disabled={loading} className="tw-btn-primary disabled:opacity-50">
              {loading ? <Spinner size={14} /> : '↺'} Refresh All
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="tw-card flex flex-col items-center justify-center">
              <div className="tw-label text-teal-600 mb-2">HAB Risk Score</div>
              {riskScore ? (
                <RiskGauge score={riskScore.score} level={riskScore.level} />
              ) : (
                <div className="text-bay-400 text-sm py-6">Loading...</div>
              )}
              <div className="text-[10px] text-gray-400 mt-1">Score mirrors HAB Oracle probability</div>
            </div>

            <div className="tw-card">
              <div className="tw-label text-teal-600 mb-3">Source Status</div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2.5 rounded-lg bg-emerald-50">
                  <div className="tw-mono text-xl font-bold text-emerald-700">{onlineCount}</div>
                  <div className="text-[10px] text-emerald-600">Online</div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-gray-50">
                  <div className="tw-mono text-xl font-bold text-gray-500">{offlineCount}</div>
                  <div className="text-[10px] text-gray-500">Offline</div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-red-50">
                  <div className="tw-mono text-xl font-bold text-red-700">{errorCount}</div>
                  <div className="text-[10px] text-red-600">Error</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2.5 rounded-lg bg-amber-50">
                  <div className="tw-mono text-xl font-bold text-amber-700">{totalFlags}</div>
                  <div className="text-[10px] text-amber-600">Flags</div>
                </div>
                <div className="text-center p-2.5 rounded-lg bg-blue-50">
                  <div className="tw-mono text-xl font-bold text-blue-700">{registry.length}</div>
                  <div className="text-[10px] text-blue-600">Sources</div>
                </div>
              </div>
            </div>

            <div className="tw-card">
              <div className="tw-label text-amber-600 mb-3">Active Risk Flags</div>
              <FlagsList flags={riskFlags} />
            </div>
          </div>

          {expandedSource && (
            <HistoryPanel
              sourceId={expandedSource}
              label={snapshotMap[expandedSource]?.label || expandedSource}
              onClose={() => setExpandedSource(null)}
            />
          )}

          {Object.entries(CATEGORY_META).map(([cat, meta]) => {
            const sources = grouped[cat]
            if (!sources?.length) return null
            return (
              <Section key={cat} title={`${meta.icon} ${meta.label}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sources.map(s => (
                    <SourceCard
                      key={s.source_id}
                      snapshot={s}
                      isRefreshing={refreshing === s.source_id}
                      sparkData={sparkHistory[s.source_id]}
                      onRefresh={() => handleRefresh(s.source_id)}
                      onToggleHistory={() => setExpandedSource(expandedSource === s.source_id ? null : s.source_id)}
                    />
                  ))}
                </div>
              </Section>
            )
          })}
          {Object.entries(grouped).filter(([cat]) => !CATEGORY_META[cat]).map(([cat, sources]) => (
            <Section key={cat} title={`? ${cat}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map(s => (
                  <SourceCard
                    key={s.source_id}
                    snapshot={s}
                    isRefreshing={refreshing === s.source_id}
                    sparkData={sparkHistory[s.source_id]}
                    onRefresh={() => handleRefresh(s.source_id)}
                    onToggleHistory={() => setExpandedSource(expandedSource === s.source_id ? null : s.source_id)}
                  />
                ))}
              </div>
            </Section>
          ))}
        </>
      )}
    </div>
  )
}

function timeAgo(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function flagSeverity(flag) {
  const criticals = ['HIGH_CHLOROPHYLL', 'ACTIVE_HAB_EVENTS_NEARBY', 'ELEVATED_HAB_ACTIVITY', 'DREDGE_ACTIVE']
  const highs = ['LOW_SALINITY', 'HIGH_TURBIDITY', 'WARM_WATER', 'HIGH_FLOW', 'RAIN_EVENT_LIKELY', 'WARM_SST']
  if (criticals.includes(flag)) return 'critical'
  if (highs.includes(flag)) return 'high'
  return 'moderate'
}

function extractKeyReadings(snapshot) {
  const readings = []
  const data = snapshot.data

  if (!data) return readings

  if (Array.isArray(data)) {
    for (const item of data.slice(0, 2)) {
      if (item.readings) {
        for (const [key, val] of Object.entries(item.readings)) {
          if (typeof val === 'object' && val.value != null && readings.length < 4) {
            readings.push({ label: val.label || key, value: typeof val.value === 'number' ? val.value.toFixed(1) : val.value, unit: val.unit })
          }
        }
      }
    }
    return readings
  }

  if (data.stats) {
    if (data.stats.mean != null) readings.push({ label: 'Mean', value: data.stats.mean.toFixed(2), unit: data.unit })
    if (data.stats.p90 != null) readings.push({ label: 'P90', value: data.stats.p90.toFixed(2), unit: data.unit })
    return readings
  }

  if (data.bulletin) {
    readings.push({ label: 'Near Bay', value: data.bulletin.near_mobile_bay, unit: 'events' })
    readings.push({ label: 'Total', value: data.bulletin.total_observations, unit: 'obs' })
    return readings
  }

  if (data.vessel_count != null) {
    readings.push({ label: 'Vessels', value: data.vessel_count, unit: '' })
    return readings
  }

  if (data.active_dredge_ops != null) {
    readings.push({ label: 'Dredge Ops', value: data.active_dredge_ops, unit: '' })
    readings.push({ label: 'Notices', value: data.notices?.length || 0, unit: '' })
    return readings
  }

  if (data.facility_count != null) {
    readings.push({ label: 'Facilities', value: data.facility_count, unit: '' })
    return readings
  }

  if (data.max_precip_chance_24h != null) {
    readings.push({ label: 'Precip 24h', value: data.max_precip_chance_24h, unit: '%' })
    return readings
  }

  if (Array.isArray(data.hourly_48h) && data.hourly_48h.length) {
    const first = data.hourly_48h[0]
    if (first.temp_f != null) readings.push({ label: 'Temp', value: first.temp_f, unit: '°F' })
    if (first.precip_chance != null) readings.push({ label: 'Rain', value: first.precip_chance, unit: '%' })
    return readings
  }

  return readings
}

function extractNumericFromSnapshot(snapshot) {
  const result = {}
  const data = snapshot.data
  if (!data) return result

  if (typeof data === 'string') {
    try { const parsed = JSON.parse(data); return extractNumericFromParsed(parsed) } catch { return result }
  }

  return extractNumericFromParsed(data)
}

function extractNumericFromParsed(data) {
  const result = {}
  if (!data) return result

  if (data.stats) {
    if (data.stats.mean != null) result.mean = data.stats.mean
    if (data.stats.p90 != null) result.p90 = data.stats.p90
    return result
  }

  if (data.max_precip_chance_24h != null) {
    result.precip_chance = data.max_precip_chance_24h
    return result
  }

  if (data.vessel_count != null) {
    result.vessels = data.vessel_count
    return result
  }

  if (data.facility_count != null) {
    result.facilities = data.facility_count
    return result
  }

  if (Array.isArray(data)) {
    for (const item of data.slice(0, 1)) {
      if (item.readings) {
        for (const [key, val] of Object.entries(item.readings)) {
          if (typeof val === 'object' && val.value != null) {
            result[key] = val.value
          }
        }
      }
    }
  }

  return result
}

import { useState, useEffect } from 'react'

const API = '/api'

const RISK_COLORS = {
  LOW: '#34d399',
  MODERATE: '#fbbf24',
  ELEVATED: '#f97316',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626',
}

function RiskGauge({ probability, riskLevel }) {
  const color = RISK_COLORS[riskLevel] || '#94a3b8'
  const angle = (probability / 100) * 180 - 90
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <svg width="200" height="120" viewBox="0 0 200 120">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
          <path
            d={`M 20 100 A 80 80 0 0 1 180 100`}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${(probability / 100) * 251} 251`}
          />
          <text x="100" y="90" textAnchor="middle" fill={color} fontSize="32" fontWeight="bold" fontFamily="monospace">
            {probability}%
          </text>
          <text x="100" y="112" textAnchor="middle" fill={color} fontSize="12">
            {riskLevel}
          </text>
        </svg>
      </div>
    </div>
  )
}

export default function HabOracle() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API}/hab/assess`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const hab = data?.hab
  const hypoxia = data?.hypoxia

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🔬 HAB Oracle</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          48–72h Harmful Algal Bloom pre-bloom prediction — Mobile Bay (World First™)
        </p>
      </div>

      {loading && (
        <div className="card p-8 flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span style={{ color: '#64748b' }}>Running HAB Oracle assessment...</span>
        </div>
      )}

      {error && (
        <div className="card p-4" style={{ borderColor: '#991b1b' }}>
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {hab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-4">HAB Risk Assessment</h2>
            <RiskGauge probability={hab.probability} riskLevel={hab.riskLevel} />
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#0a0d12' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>RECOMMENDED ACTION</p>
              <p className="text-sm text-white">{hab.action}</p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-4">72-Hour Outlook</h2>
            <div className="space-y-3">
              {[
                { label: '24h', val: hab.outlook?.h24 },
                { label: '48h', val: hab.outlook?.h48 },
                { label: '72h', val: hab.outlook?.h72 },
              ].map(({ label, val }) => {
                const pct = val ?? 0
                const color = pct < 20 ? '#34d399' : pct < 45 ? '#fbbf24' : pct < 65 ? '#f97316' : '#ef4444'
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: '#94a3b8' }}>{label}</span>
                      <span style={{ color, fontFamily: 'monospace' }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: '#1e293b' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>TOP RISK FACTORS</h3>
              <div className="space-y-1">
                {hab.rankedFactors?.map((f, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white">{f.name}</span>
                    <span className="font-mono" style={{ color: '#38bdf8' }}>{f.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {hypoxia && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Hypoxia Forecast (5-day)</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold font-mono" style={{ color: RISK_COLORS[hypoxia.riskLevel] || '#94a3b8' }}>
                  {hypoxia.probability}%
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: RISK_COLORS[hypoxia.riskLevel] || '#94a3b8' }}>
                    {hypoxia.riskLevel}
                  </div>
                  <div className="text-xs" style={{ color: '#64748b' }}>
                    Expected min DO: {hypoxia.expectedMinDO} mg/L
                  </div>
                  {hypoxia.jubileeRisk && (
                    <div className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                      ⚠️ Jubilee conditions possible
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-white mb-3">Data Quality</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Confidence</span>
                <span className="text-white">{hab.dataQuality?.confidence}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Inputs Available</span>
                <span className="text-white">{hab.dataQuality?.inputCount} / {hab.dataQuality?.totalInputs}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Seasonal Prior</span>
                <span className="text-white">{hab.seasonalPrior}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#64748b' }}>Oracle Version</span>
                <span className="font-mono text-white">{hab.version}</span>
              </div>
            </div>
            <div className="mt-3 text-xs" style={{ color: '#475569' }}>
              {hab.methodology}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

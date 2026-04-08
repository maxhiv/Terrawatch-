import { useState, useEffect } from 'react'
import clsx from 'clsx'

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
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#d1e7dd" strokeWidth="16" strokeLinecap="round" />
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
    <div className="p-6 space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-bay-900">🔬 HAB Oracle</h1>
        <p className="text-sm mt-1 text-bay-500">
          48–72h Harmful Algal Bloom pre-bloom prediction — Mobile Bay (World First™)
        </p>
      </div>

      {loading && (
        <div className="tw-card p-8 flex items-center justify-center gap-3">
          <div className="tw-skeleton h-4 w-48 rounded" />
          <span className="text-bay-500">Running HAB Oracle assessment...</span>
        </div>
      )}

      {error && (
        <div className="tw-card tw-glass-tint-red p-4">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      )}

      {hab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={clsx('tw-card p-6', hab.riskLevel === 'HIGH' || hab.riskLevel === 'CRITICAL' ? 'tw-glass-tint-red' : hab.riskLevel === 'MODERATE' || hab.riskLevel === 'ELEVATED' ? 'tw-glass-tint-amber' : 'tw-glass-tint-green')}>
            <RiskGauge probability={hab.probability} riskLevel={hab.riskLevel} />
            <div className="mt-4 p-3 rounded-lg bg-bay-800/90 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold mb-1 text-bay-200">RECOMMENDED ACTION</p>
              <p className="text-sm">{hab.action}</p>
            </div>
          </div>

          <div className="tw-card p-6">
            <h2 className="text-sm font-semibold text-bay-700 mb-4">72-Hour Outlook</h2>
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
                      <span className="text-bay-500">{label}</span>
                      <span style={{ color, fontFamily: 'monospace' }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-bay-100">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold mb-2 text-bay-400">TOP RISK FACTORS</h3>
              <div className="space-y-1">
                {hab.rankedFactors?.map((f, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-bay-700">{f.name}</span>
                    <span className="font-mono text-teal-600">{f.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {hypoxia && (
            <div className="tw-card p-6">
              <h2 className="text-sm font-semibold text-bay-700 mb-4">Hypoxia Forecast (5-day)</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold font-mono" style={{ color: RISK_COLORS[hypoxia.riskLevel] || '#94a3b8' }}>
                  {hypoxia.probability}%
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: RISK_COLORS[hypoxia.riskLevel] || '#94a3b8' }}>
                    {hypoxia.riskLevel}
                  </div>
                  <div className="text-xs text-bay-500">
                    Expected min DO: {hypoxia.expectedMinDO} mg/L
                  </div>
                  {hypoxia.jubileeRisk && (
                    <div className="text-xs mt-1 text-amber-600">
                      ⚠️ Jubilee conditions possible
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="tw-card p-6">
            <h2 className="text-sm font-semibold text-bay-700 mb-3">Data Quality</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-bay-500">Confidence</span>
                <span className="text-bay-800">{hab.dataQuality?.confidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bay-500">Inputs Available</span>
                <span className="text-bay-800">{hab.dataQuality?.inputCount} / {hab.dataQuality?.totalInputs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bay-500">Seasonal Prior</span>
                <span className="text-bay-800">{hab.seasonalPrior}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bay-500">Oracle Version</span>
                <span className="font-mono text-bay-800">{hab.version}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-bay-500">
              {hab.methodology}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

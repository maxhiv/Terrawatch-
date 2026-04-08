import { useEffect } from 'react'
import { useStore } from '../../store/index.js'
import { PageHeader, StatCard, Section, RiskBadge, AlertBanner, Spinner, EmptyState } from '../../components/common/index.jsx'
import clsx from 'clsx'

export default function BeachSafety() {
  const { beach, loading, fetchBeach } = useStore()

  useEffect(() => { fetchBeach() }, [])

  const data = beach
  const safety = data?.swimSafety
  const cond = data?.conditions || {}
  const closures = data?.shellfishClosures

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="🏖️"
        title="Beach Safety Intelligence"
        subtitle="Swim conditions · Shellfish closures · Water quality"
        actions={
          <button onClick={fetchBeach} disabled={loading.beach} className="tw-btn-primary disabled:opacity-50">
            {loading.beach ? <Spinner size={14} /> : '↺'} Refresh
          </button>
        }
      />

      {closures?.activeClosure && (
        <AlertBanner type="danger">
          <strong>Active ADPH Shellfish Closure</strong> — Check closure areas before harvesting.
        </AlertBanner>
      )}

      <Section title="Swim Safety Index">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Swim Safety" value={safety?.score ?? '—'} unit="/100" color={safety?.score >= 75 ? '#0a9e80' : safety?.score >= 50 ? '#d97706' : '#dc2626'} icon="🏊" sub={<RiskBadge level={safety?.level ?? 'UNKNOWN'} />} riskLevel={safety?.level} />
          <StatCard label="Water Temp" value={cond.waterTemp_f ?? '—'} unit="°F" color="#1d6fcc" icon="🌡️" sub={cond.waterTemp_c != null ? `${cond.waterTemp_c.toFixed(1)}°C` : null} />
          <StatCard label="Wave Height" value={cond.wave_height_m != null ? cond.wave_height_m.toFixed(1) : '—'} unit="m" color={cond.wave_height_m > 1.5 ? '#dc2626' : '#0a9e80'} icon="🌊" sub="NDBC Buoy 42012" />
          <StatCard label="UV Index" value={cond.uv_index ?? '—'} color={cond.uv_index > 8 ? '#dc2626' : cond.uv_index > 5 ? '#d97706' : '#0a9e80'} icon="☀️" sub={cond.uv_index > 8 ? 'Very High' : cond.uv_index > 5 ? 'High' : 'Moderate'} />
          <StatCard label="Wind" value={cond.wind_mph ?? '—'} unit="mph" color="#0a9e80" icon="💨" sub={cond.wind_gust_mph ? `Gusts: ${cond.wind_gust_mph} mph` : null} />
          <StatCard label="Currents" value={cond.current_speed_ms != null ? cond.current_speed_ms.toFixed(2) : '—'} unit="m/s" color={cond.current_speed_ms > 0.5 ? '#dc2626' : '#0a9e80'} icon="↻" sub={cond.current_direction || 'HF Radar'} />
          <StatCard label="Air Quality" value={cond.aqi ?? '—'} unit="AQI" color={cond.aqi > 100 ? '#dc2626' : '#0a9e80'} icon="🌬️" sub="AirNow" />
        </div>
      </Section>

      {closures?.closures?.length > 0 && (
        <Section title="ADPH Shellfish Closures">
          <div className="tw-card">
            <div className="space-y-3">
              {closures.closures.map((c, i) => (
                <div key={i} className={clsx('flex items-center justify-between p-3 rounded-lg border',
                  c.status === 'closed' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50')}>
                  <div>
                    <div className="font-semibold text-sm text-bay-800">{c.area}</div>
                    <div className="text-xs text-bay-400 mt-0.5">{c.reason}</div>
                    <div className="tw-mono text-[9px] text-bay-300 mt-1">Updated: {c.lastUpdate}</div>
                  </div>
                  <span className={clsx('tw-badge font-bold',
                    c.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')}>
                    {c.status?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 tw-mono text-[9px] text-bay-300">
              Source: {closures.sourceUrl} | {closures.scraped ? 'Live scrape' : 'Seed data'}
            </div>
          </div>
        </Section>
      )}

      {data?.beaches?.length > 0 && (
        <Section title="Monitored Beaches">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.beaches.map((b, i) => (
              <div key={i} className="tw-card">
                <div className="font-semibold text-sm text-bay-800">{b.name}</div>
                <div className="tw-label text-[9px] mt-1">{b.type}</div>
                {b.waterTemp != null && <div className="tw-mono text-sm font-bold text-blue-600 mt-2">{Math.round(b.waterTemp * 9/5 + 32)}°F</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {!data && !loading.beach && <EmptyState icon="🏖️" message="Loading beach safety data..." />}
    </div>
  )
}

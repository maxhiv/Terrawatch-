import { useEffect } from 'react'
import { useStore } from '../../store/index.js'
import { PageHeader, StatCard, Section, RiskBadge, AlertBanner, Spinner, EmptyState } from '../../components/common/index.jsx'

export default function PollutionTracker() {
  const { pollution, loading, fetchPollution } = useStore()

  useEffect(() => { fetchPollution() }, [])

  const data = pollution
  const pi = data?.pollutionIndex ?? null
  const level = data?.riskLevel ?? 'LOW'
  const air = data?.airQuality || {}
  const water = data?.waterQuality || {}

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="🏭"
        title="Pollution Tracker"
        subtitle="Air quality · Water turbidity · Nutrient loading · NPDES compliance"
        actions={
          <button onClick={fetchPollution} disabled={loading.pollution} className="tw-btn-primary disabled:opacity-50">
            {loading.pollution ? <Spinner size={14} /> : '↺'} Refresh
          </button>
        }
      />

      {pi != null && pi >= 50 && (
        <AlertBanner type="warning">
          <strong>Elevated pollution index: {pi}%</strong> — Air quality or water quality concerns detected.
        </AlertBanner>
      )}

      <Section title="Pollution Index">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pollution Index" value={pi ?? '—'} unit="%" color={pi >= 60 ? '#dc2626' : pi >= 30 ? '#d97706' : '#0a9e80'} icon="🏭" sub={<RiskBadge level={level} />} riskLevel={level} />
          <StatCard label="AQI" value={air.aqi ?? '—'} unit="AQI" color={air.aqi > 100 ? '#dc2626' : air.aqi > 50 ? '#d97706' : '#0a9e80'} icon="🌬️" sub={air.category || 'AirNow'} alert={air.aqi > 100} />
          <StatCard label="PM2.5 Average" value={air.pm25?.average ?? '—'} unit="µg/m³" color={air.pm25?.average > 35 ? '#dc2626' : air.pm25?.average > 12 ? '#d97706' : '#0a9e80'} icon="🌫️" sub={`${air.pm25?.sourceCount ?? 0} sources`} />
          <StatCard label="Max Turbidity" value={water.turbidity?.max != null ? water.turbidity.max.toFixed(1) : '—'} unit="NTU" color={water.turbidity?.max > 25 ? '#dc2626' : '#0a9e80'} icon="◎" sub={`${water.turbidity?.stationCount ?? 0} stations`} />
        </div>
      </Section>

      <Section title="Air Quality Sources">
        <div className="tw-card">
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'OpenAQ', value: air.pm25?.sources?.openAQ, color: '#0a9e80' },
              { name: 'PurpleAir', value: air.pm25?.sources?.purpleAir, color: '#7c3aed' },
              { name: 'EPA AQS', value: air.pm25?.sources?.epaAQS, color: '#1d6fcc' },
            ].map(s => (
              <div key={s.name} className="text-center p-3 rounded-lg bg-bay-50">
                <div className="tw-label mb-1">{s.name}</div>
                <div className="tw-mono text-xl font-bold" style={{ color: s.value != null ? s.color : '#94a3b8' }}>
                  {s.value != null ? s.value.toFixed(1) : '—'}
                </div>
                <div className="text-[9px] text-bay-400 mt-1">µg/m³ PM2.5</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Water Quality Nutrients">
        <div className="tw-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-bay-50">
              <div className="tw-label mb-1">Avg Turbidity</div>
              <div className="tw-mono text-xl font-bold text-bay-700">{water.turbidity?.avg ?? '—'}</div>
              <div className="text-[9px] text-bay-400">NTU</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-bay-50">
              <div className="tw-label mb-1">Orthophosphate</div>
              <div className="tw-mono text-xl font-bold text-bay-700">{water.nutrients?.orthophosphate_max ?? '—'}</div>
              <div className="text-[9px] text-bay-400">mg/L max</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-bay-50">
              <div className="tw-label mb-1">Total Nitrogen</div>
              <div className="tw-mono text-xl font-bold text-bay-700">{water.nutrients?.totalNitrogen_max ?? '—'}</div>
              <div className="text-[9px] text-bay-400">mg/L max</div>
            </div>
            {data?.npdes && (
              <div className="text-center p-3 rounded-lg bg-bay-50">
                <div className="tw-label mb-1">NPDES Permits</div>
                <div className="tw-mono text-xl font-bold text-bay-700">{data.npdes.count ?? '—'}</div>
                <div className="text-[9px] text-bay-400">
                  {data.npdes.violating > 0 ? `${data.npdes.violating} with violations` : 'No violations'}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {!data && !loading.pollution && <EmptyState icon="🏭" message="Loading pollution tracker data..." />}
    </div>
  )
}

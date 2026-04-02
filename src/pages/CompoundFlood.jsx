import { useEffect } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, StatCard, Section, RiskBadge, AlertBanner, Spinner, EmptyState } from '../components/Common/index.jsx'

export default function CompoundFlood() {
  const { flood, loading, fetchFlood, fetchAll, lastFetchedAt } = useStore()

  useEffect(() => { fetchFlood() }, [])

  const data = flood
  const risk = data?.compoundFloodRisk ?? null
  const level = data?.riskLevel ?? 'LOW'

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="🌊"
        title="Compound Flood Intelligence"
        subtitle="Riverine + pluvial + coastal flood risk analysis"
        actions={
          <button onClick={fetchFlood} disabled={loading.flood} className="tw-btn-primary disabled:opacity-50">
            {loading.flood ? <Spinner size={14} /> : '↺'} Refresh
          </button>
        }
      />

      {risk != null && risk >= 60 && (
        <AlertBanner type="danger">
          <strong>Elevated compound flood risk: {risk}%</strong> — Monitor AHPS gages and GOES QPE closely.
        </AlertBanner>
      )}

      <Section title="Compound Flood Risk">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Compound Risk" value={risk ?? '—'} unit="%" color={risk >= 70 ? '#dc2626' : risk >= 40 ? '#d97706' : '#0a9e80'} icon="🌊" sub={<RiskBadge level={level} />} riskLevel={level} />
          <StatCard label="AHPS Flood Stage" value={data?.ahps?.stage ?? '—'} unit="ft" color={data?.ahps?.stage > 12 ? '#dc2626' : '#1d6fcc'} icon="📏" sub={data?.ahps?.available ? 'Mobile River at Mobile' : 'No data'} />
          <StatCard label="GOES QPE 6h" value={data?.goes_qpe?.h6 != null ? data.goes_qpe.h6.toFixed(1) : '—'} unit="mm" color="#d97706" icon="🛰️" sub="Quantitative Precip Estimate" />
          <StatCard label="GOES QPE 24h" value={data?.goes_qpe?.h24 != null ? data.goes_qpe.h24.toFixed(1) : '—'} unit="mm" color="#d97706" icon="🛰️" sub="24-hour accumulation" />
          <StatCard label="River Flow" value={data?.riverFlow?.total_cfs != null ? (data.riverFlow.total_cfs / 1000).toFixed(0) : '—'} unit="K cfs" color="#1d6fcc" icon="〜" sub={`${data?.riverFlow?.stations?.length ?? 0} USGS stations`} />
          <StatCard label="7-Day Precip" value={data?.precipitation?.sum_7d_mm != null ? data.precipitation.sum_7d_mm.toFixed(0) : '—'} unit="mm" color="#7c3aed" icon="🌧️" sub="Forecast accumulation" />
          <StatCard label="Max Precip Prob" value={data?.precipitation?.max_prob_7d ?? '—'} unit="%" color="#d97706" icon="☔" sub="7-day max probability" />
        </div>
      </Section>

      {data?.riverFlow?.stations?.length > 0 && (
        <Section title="USGS Gage Heights">
          <div className="tw-card">
            <div className="space-y-2">
              {data.riverFlow.stations.map(s => (
                <div key={s.siteNo} className="flex items-center justify-between py-2 border-b border-bay-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-bay-700">{s.station}</div>
                    <div className="tw-mono text-[9px] text-bay-300">{s.siteNo}</div>
                  </div>
                  <div className="flex gap-4">
                    {s.gage_ft != null && <div className="tw-mono text-sm font-bold text-blue-600">{s.gage_ft.toFixed(2)} ft</div>}
                    {s.flow_cfs != null && <div className="tw-mono text-xs text-bay-400">{(s.flow_cfs/1000).toFixed(1)}K cfs</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {data?.forecast?.length > 0 && (
        <Section title="7-Day Precipitation Forecast">
          <div className="tw-card">
            <div className="grid grid-cols-7 gap-2">
              {data.forecast.map((d, i) => {
                const dayName = d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${i+1}`
                return (
                  <div key={i} className="text-center p-2 rounded-lg bg-bay-50">
                    <div className="tw-label mb-1">{dayName}</div>
                    <div className="tw-mono text-lg font-bold text-blue-600">{d.precip_mm != null ? d.precip_mm.toFixed(0) : '—'}</div>
                    <div className="text-[9px] text-bay-400">mm</div>
                    {d.precipProb != null && (
                      <div className="tw-mono text-[10px] text-bay-300 mt-1">{d.precipProb}%</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Section>
      )}

      {!data && !loading.flood && <EmptyState icon="🌊" message="Loading flood intelligence data..." />}
    </div>
  )
}

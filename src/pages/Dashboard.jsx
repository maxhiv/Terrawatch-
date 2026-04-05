import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/index.js'
import { StatCard, PageHeader, RiskBadge, Spinner, Section, EmptyState, AlertBanner, SkeletonCard } from '../components/Common/index.jsx'
import { HABProbabilityChart, WeatherForecastChart } from '../components/Charts/index.jsx'
import clsx from 'clsx'

function safeVal(v) {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'object' && 'value' in v) return safeVal(v.value)
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function Dashboard() {
  const {
    waterQuality, habAssessment, weather, alerts, loading,
    nerrs, hfradar, aqi, goesStatus, goesLatest, ecologyStatus, sensors, landStatus, airplusStatus,
    flood, beach, climate, pollution, inference,
    fetchAll, fetchNERRS, fetchHFRadar, fetchAQI, fetchGOESStatus, fetchGoesLatest,
    fetchEcologyStatus, fetchLandStatus, fetchAirPlusStatus,
    fetchFlood, fetchBeach, fetchClimate, fetchPollution, fetchInference,
    lastUpdated, lastFetchedAt
  } = useStore()

  const isLoading = Object.values(loading).some(Boolean)

  const [dsStatus, setDsStatus] = useState(null)

  useEffect(() => {
    fetchNERRS()
    fetchHFRadar()
    fetchAQI()
    fetchGOESStatus()
    fetchGoesLatest()
    fetchEcologyStatus()
    fetchLandStatus()
    fetchAirPlusStatus()
    fetchFlood()
    fetchBeach()
    fetchClimate()
    fetchPollution()
    fetchInference()
    Promise.all([
      fetch('/api/datasources').then(r => r.json()),
      fetch('/api/datasources/latest').then(r => r.json()),
    ]).then(([regRes, latestRes]) => {
      const sources = regRes.sources || []
      const snaps = latestRes.snapshots || []
      const snapMap = {}
      for (const s of snaps) snapMap[s.source_id] = s
      let online = 0, offline = 0, errors = 0
      for (const src of sources) {
        const s = snapMap[src.id]
        if (!s || !s.timestamp) { offline++; continue }
        if (s.error) { errors++; continue }
        const ageMs = Date.now() - new Date(s.timestamp).getTime()
        const pollMs = (src.poll_interval_min || 15) * 60 * 1000
        if (ageMs > pollMs * 3) { offline++ } else { online++ }
      }
      const flags = (latestRes.active_flags || []).length
      setDsStatus({ total: sources.length, online, offline, errors, flags })
    }).catch(() => {})
    fetch('/api/datasources/risk/score').then(r => r.json()).then(d => {
      setDsStatus(prev => prev ? { ...prev, habScore: d.score, habLevel: d.level } : { habScore: d.score, habLevel: d.level })
    }).catch(() => {})
  }, [])

  const habProb = habAssessment?.hab?.probability
  const habLevel = habAssessment?.hab?.riskLevel
  const hypoxia = habAssessment?.hypoxia

  const habTimeline = habAssessment?.hab?.seasonalTimeline || [
    { month: 'Jan', probability: 10 }, { month: 'Feb', probability: 12 },
    { month: 'Mar', probability: 18 }, { month: 'Apr', probability: 25 },
    { month: 'May', probability: 35 }, { month: 'Jun', probability: 55 },
    { month: 'Jul', probability: 72 }, { month: 'Aug', probability: 78 },
    { month: 'Sep', probability: 65 }, { month: 'Oct', probability: 40 },
    { month: 'Nov', probability: 20 }, { month: 'Dec', probability: 12 },
  ]

  const usgs = waterQuality?.usgs || []
  const do2Vals = usgs.map(s => safeVal(s.readings?.do_mg_l)).filter(v => v != null)
  const do2 = do2Vals.length ? Math.min(...do2Vals) : null
  const doAlert = do2 != null && do2 < 4

  const streamflow = usgs.reduce((sum, s) => {
    const f = safeVal(s.readings?.streamflow_cfs)
    return f != null ? sum + f : sum
  }, 0) || null

  const tempF = safeVal(weather?.current?.temp_f)
  const tempC = safeVal(weather?.current?.temp_c)
  const windMph = safeVal(weather?.current?.wind_speed_mph) ?? safeVal(weather?.current?.wind_mph)
  const windDir = safeVal(weather?.current?.wind_direction)
  const salinity = safeVal(waterQuality?.coops?.['8735180']?.salinity?.value)

  const goesSst = safeVal(goesStatus?.status?.latestSST_C) ?? safeVal(goesStatus?.push?.sst_mean)
  const goesSstSource = goesStatus?.status?.source === 'push' || (safeVal(goesStatus?.status?.latestSST_C) == null && safeVal(goesStatus?.push?.sst_mean) != null) ? 'push' : 'erddap'
  const goesPush = goesStatus?.push
  const aqiVal = aqi?.readings?.[0]?.aqi
  const aqiCat = aqi?.readings?.[0]?.category

  const inatCount = ecologyStatus?.iNaturalist?.totalCount
  const totalSensors = sensors?.summary?.active || 0

  const uvIndex = safeVal(landStatus?.openMeteo?.current?.uv_index)
  const windGustMph = safeVal(weather?.current?.wind_gust_mph)
  const pm25Purple = safeVal(airplusStatus?.purpleAir?.avgPM25)
  const pm25OpenAQ = safeVal(airplusStatus?.openAQ?.avgPM25)
  const pm25Sources = [pm25Purple, pm25OpenAQ].filter(v => v != null)
  const pm25 = pm25Sources.length ? pm25Sources.reduce((a,b) => a+b, 0) / pm25Sources.length : null
  const pm25Source = pm25Sources.length > 1 ? `Avg ${pm25Sources.length} sources` : (pm25Purple != null ? 'PurpleAir' : pm25OpenAQ != null ? 'OpenAQ' : '—')

  const goesBloom = safeVal(goesLatest?.bloom_index)
  const goesCloud = safeVal(goesLatest?.cloud_coverage)
  const goesGlm = safeVal(goesLatest?.glm_flashes)

  const habSparkData = habTimeline.map(m => ({ v: m.probability }))
  const forecastTemps = landStatus?.openMeteo?.dailyForecast?.map(d => ({ v: d.high_c })) || []
  const forecastPrecip = landStatus?.openMeteo?.dailyForecast?.map(d => ({ v: d.precipProb || 0 })) || []

  const openMeteo = landStatus?.openMeteo
  const forecastData = openMeteo?.dailyForecast?.map(d => {
    const dayName = d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '?'
    const highF = d.high_c != null ? Math.round(d.high_c * 9/5 + 32) : null
    const lowF = d.low_c != null ? Math.round(d.low_c * 9/5 + 32) : null
    return { day: dayName, high: highF, low: lowF, precipChance: d.precipProb || 0 }
  }) || []

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="◎"
        title="Environmental Dashboard"
        subtitle={`Mobile Bay · Real-time monitoring · ${totalSensors || '50+'} data sources`}
        actions={
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="tw-mono text-[9px] text-bay-300">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button onClick={fetchAll} disabled={isLoading}
              className="tw-btn-primary disabled:opacity-50">
              {isLoading ? <Spinner size={14} /> : '↺'}
              Refresh
            </button>
          </div>
        }
      />

      {alerts.length > 0 && (
        <AlertBanner type="warning">
          <strong>{alerts.length} active NWS alert{alerts.length > 1 ? 's' : ''}:</strong>{' '}
          {alerts[0]?.headline}
        </AlertBanner>
      )}

      {(goesBloom != null || goesGlm != null || goesSst != null) && (() => {
        const goesGrad = safeVal(goesLatest?.sst_gradient)
        const goesQpe = safeVal(goesLatest?.qpe_rainfall)
        const stratAlert = goesGrad != null && goesGrad >= 3.5
        const nutrientPulse = goesQpe != null && goesQpe > 10
        return (
          <div className="tw-card mb-4 tw-glass-tint-green" style={{borderLeft:`3px solid ${stratAlert ? '#dc2626' : '#d97706'}`}}>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="tw-label text-orange-600">GOES-19 Intelligence</div>
              {stratAlert && <span className="tw-mono text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">STRATIFICATION ALERT</span>}
              {nutrientPulse && <span className="tw-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">NUTRIENT PULSE</span>}
              {goesBloom != null && <span className="tw-mono text-xs"><strong>Bloom:</strong> {goesBloom.toFixed(2)}</span>}
              {goesGrad != null && <span className="tw-mono text-xs"><strong>SST Gradient:</strong> {goesGrad.toFixed(1)}°C/km</span>}
              {goesCloud != null && <span className="tw-mono text-xs"><strong>Cloud:</strong> {goesCloud.toFixed(0)}%</span>}
              {goesQpe != null && <span className="tw-mono text-xs"><strong>QPE:</strong> {goesQpe.toFixed(1)} mm</span>}
              {goesGlm != null && <span className="tw-mono text-xs"><strong>Lightning:</strong> {goesGlm} flashes</span>}
            </div>
          </div>
        )
      })()}

      <Section title="Current Conditions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="HAB Probability" value={habProb != null ? habProb : '—'} unit="%" color={habProb >= 65 ? '#dc2626' : habProb >= 45 ? '#d97706' : '#0a9e80'} icon="⬡" sub={habLevel ? <RiskBadge level={habLevel} /> : 'Calculating...'} riskLevel={habLevel} freshness={lastFetchedAt.hab} sparkData={habSparkData} sparkColor={habProb >= 65 ? '#dc2626' : '#d97706'} />
          <StatCard label="Dissolved Oxygen" value={do2 != null ? do2.toFixed(1) : '—'} unit="mg/L" color={doAlert ? '#dc2626' : '#0a9e80'} icon="○" sub={do2 != null ? (doAlert ? '⚠ Below stress threshold' : 'Acceptable range') : 'No data'} alert={doAlert} freshness={lastFetchedAt.water} />
          <StatCard label="Water Temperature" value={tempF != null ? tempF.toFixed(1) : tempC != null ? tempC.toFixed(1) : '—'} unit={tempF != null ? '°F' : '°C'} color="#1d6fcc" icon="≋" sub={tempC != null ? `${tempC.toFixed(1)}°C` : null} freshness={lastFetchedAt.weather} sparkData={forecastTemps} sparkColor="#1d6fcc" />
          <StatCard label="Salinity" value={salinity != null ? salinity.toFixed(1) : '—'} unit="ppt" color="#7c3aed" icon="◈" sub="Dauphin Island" freshness={lastFetchedAt.water} />
          <StatCard label="Hypoxia Risk" value={hypoxia?.probability ?? '—'} unit="%" color={hypoxia?.probability >= 60 ? '#dc2626' : '#d97706'} icon="〇" sub={hypoxia?.riskLevel ? <RiskBadge level={hypoxia.riskLevel} /> : null} riskLevel={hypoxia?.riskLevel} freshness={lastFetchedAt.hab} />
          <StatCard label="Streamflow" value={streamflow != null ? (streamflow / 1000).toFixed(0) : '—'} unit="K cfs" color="#1d6fcc" icon="〜" sub="Alabama R. + Mobile R." freshness={lastFetchedAt.water} sparkData={usgs.map(s => ({ v: safeVal(s.readings?.streamflow_cfs) || 0 })).filter(d => d.v > 0)} sparkColor="#1d6fcc" />
          <StatCard label="Wind Speed" value={windMph != null ? windMph.toFixed(0) : '—'} unit="mph" color="#0a9e80" icon="≈" sub={windDir != null ? `${windDir}° direction` : weather?.current?.description} freshness={lastFetchedAt.weather} sparkData={forecastPrecip} sparkColor="#0a9e80" />
          <StatCard label="Jubilee Risk" value={hypoxia?.jubileeRisk ? 'ELEVATED' : 'LOW'} color={hypoxia?.jubileeRisk ? '#dc2626' : '#0a9e80'} icon="★" sub="Mobile Bay east shore" riskLevel={hypoxia?.jubileeRisk ? 'ELEVATED' : 'LOW'} freshness={lastFetchedAt.hab} />
        </div>
      </Section>

      <Section title="Extended Monitoring">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="GOES-19 SST" value={goesSst != null ? goesSst.toFixed(1) : '—'} unit="°C" color="#d97706" icon="🛰️" sub={goesSst != null ? (goesSstSource === 'push' ? 'Push pipeline · 5-min' : 'Gulf of Mexico · Hourly') : 'Gulf of Mexico · Hourly'} freshness={lastFetchedAt.goes} />
          <StatCard label="Air Quality" value={aqiVal ?? '—'} unit="AQI" color={aqiVal > 100 ? '#dc2626' : aqiVal > 50 ? '#f59e0b' : '#10b981'} icon="🌬️" sub={aqiCat || 'AirNow'} alert={aqiVal > 100} freshness={lastFetchedAt.aqi} sparkData={(aqi?.readings || []).map(r => ({ v: r.aqi || 0 }))} sparkColor={aqiVal > 100 ? '#dc2626' : '#10b981'} />
          <StatCard label="UV Index" value={uvIndex != null ? uvIndex.toFixed(1) : '—'} color={uvIndex > 8 ? '#dc2626' : uvIndex > 5 ? '#f59e0b' : '#10b981'} icon="☀️" sub={uvIndex != null ? (uvIndex > 8 ? 'Very High' : uvIndex > 5 ? 'High' : uvIndex > 2 ? 'Moderate' : 'Low') : 'Open-Meteo'} alert={uvIndex > 8} freshness={lastFetchedAt.sensors} />
          <StatCard label="Wind Gust" value={windGustMph != null ? windGustMph.toFixed(0) : '—'} unit="mph" color={windGustMph > 30 ? '#dc2626' : '#0a9e80'} icon="💨" sub="NWS max gust" alert={windGustMph > 30} freshness={lastFetchedAt.weather} />
          <StatCard label="PM2.5" value={pm25 != null ? pm25.toFixed(1) : '—'} unit="µg/m³" color={pm25 > 35 ? '#dc2626' : pm25 > 12 ? '#f59e0b' : '#10b981'} icon="🌫️" sub={pm25Source} alert={pm25 > 35} freshness={lastFetchedAt.sensors} />
          <StatCard label="Biodiversity" value={inatCount ?? '—'} unit="obs" color="#16a34a" icon="🦎" sub="iNaturalist 7-day" freshness={lastFetchedAt.sensors} />
          <StatCard label="Active Feeds" value={totalSensors || '—'} color="#0a9e80" icon="⊞" sub={`${sensors?.summary?.totalActiveFeeds || '—'} total feeds`} freshness={lastFetchedAt.sensors} />
          <StatCard label="Feature Vector" value="152" unit="keys" color="#7c3aed" icon="⊡" sub="ML input features" freshness={lastFetchedAt.sensors} />
        </div>
      </Section>

      <Section title="Product Intelligence">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/compound-flood" className="no-underline">
            <StatCard label="Compound Flood" value={flood?.compoundFloodRisk ?? '—'} unit="%" color={flood?.compoundFloodRisk >= 70 ? '#dc2626' : flood?.compoundFloodRisk >= 40 ? '#d97706' : '#0a9e80'} icon="🌊" sub={<RiskBadge level={flood?.riskLevel ?? 'LOW'} />} riskLevel={flood?.riskLevel} freshness={lastFetchedAt.flood} />
          </Link>
          <Link to="/beach-safety" className="no-underline">
            <StatCard label="Beach Safety" value={beach?.swimSafety?.score ?? '—'} unit="/100" color={beach?.swimSafety?.score >= 75 ? '#0a9e80' : beach?.swimSafety?.score >= 50 ? '#d97706' : '#dc2626'} icon="🏖️" sub={<RiskBadge level={beach?.swimSafety?.level ?? 'UNKNOWN'} />} riskLevel={beach?.swimSafety?.level} freshness={lastFetchedAt.beach} />
          </Link>
          <Link to="/climate" className="no-underline">
            <StatCard label="Climate Vulnerability" value={climate?.vulnerabilityIndex ?? '—'} unit="%" color={climate?.vulnerabilityIndex >= 65 ? '#dc2626' : climate?.vulnerabilityIndex >= 35 ? '#d97706' : '#0a9e80'} icon="🌍" sub={<RiskBadge level={climate?.riskLevel ?? 'LOW'} />} riskLevel={climate?.riskLevel} freshness={lastFetchedAt.climate} />
          </Link>
          <Link to="/pollution" className="no-underline">
            <StatCard label="Pollution Index" value={pollution?.pollutionIndex ?? '—'} unit="%" color={pollution?.pollutionIndex >= 60 ? '#dc2626' : pollution?.pollutionIndex >= 30 ? '#d97706' : '#0a9e80'} icon="🏭" sub={<RiskBadge level={pollution?.riskLevel ?? 'LOW'} />} riskLevel={pollution?.riskLevel} freshness={lastFetchedAt.pollution} />
          </Link>
        </div>
        {flood?.ahps?.stage != null && (
          <div className="tw-card mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="tw-label text-blue-600 mb-1">AHPS Flood Stage — Mobile River</div>
                <div className="tw-mono text-2xl font-bold text-blue-700">{flood.ahps.stage.toFixed(2)} ft</div>
              </div>
              {flood?.precipitation?.sum_7d_mm != null && (
                <div className="text-right">
                  <div className="tw-label mb-1">7-Day Precip Forecast</div>
                  <div className="tw-mono text-lg font-bold text-purple-600">{flood.precipitation.sum_7d_mm.toFixed(0)} mm</div>
                </div>
              )}
            </div>
            {flood?.forecast?.length > 0 && (
              <div className="grid grid-cols-7 gap-1 mt-3">
                {flood.forecast.map((d, i) => {
                  const dayName = d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : `D${i+1}`
                  return (
                    <div key={i} className="text-center p-1 rounded bg-bay-50">
                      <div className="text-[9px] text-bay-400">{dayName}</div>
                      <div className="tw-mono text-xs font-bold text-blue-600">{d.precip_mm != null ? d.precip_mm.toFixed(0) : '—'}</div>
                      <div className="text-[8px] text-bay-300">mm</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {inference?.prediction != null && (
          <div className="tw-card mt-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="tw-label text-purple-600 mb-1">ML Inference — {inference.modelPhase || 'Phase 2'}</div>
                <div className="flex items-center gap-3">
                  <div className="tw-mono text-2xl font-bold" style={{ color: inference.prediction > 0.5 ? '#dc2626' : '#0a9e80' }}>
                    {(inference.prediction * 100).toFixed(0)}%
                  </div>
                  <RiskBadge level={inference.riskLevel || 'LOW'} />
                  <span className="tw-mono text-xs text-bay-400">Confidence: {inference.confidence || '—'}</span>
                </div>
              </div>
              {inference.shap && (
                <div className="text-right">
                  <div className="tw-label mb-1">Top SHAP Features</div>
                  <div className="space-y-0.5">
                    {Object.entries(inference.shap)
                      .filter(([,v]) => typeof v === 'number' && !isNaN(v))
                      .sort(([,a],[,b]) => Math.abs(b) - Math.abs(a))
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <div key={k} className="tw-mono text-[9px]">
                          <span className="text-bay-500">{k}:</span>{' '}
                          <span className={v > 0 ? 'text-red-600' : 'text-blue-600'}>{v > 0 ? '+' : ''}{v.toFixed(3)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {dsStatus && (
        <Link to="/data-sources" className="block no-underline mb-4">
          <div className="tw-card tw-glass-tint-green hover:shadow-md transition-shadow" style={{ borderLeft: '3px solid #0ea5e9' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="tw-label text-blue-600">External Data Sources — 9 Live Integrations</div>
              <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">VIEW ALL →</span>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tw-mono text-xs font-bold text-emerald-700">{dsStatus.online || 0}/{dsStatus.total || 0} Online</span>
              </div>
              {dsStatus.habScore != null && (
                <div className="flex items-center gap-2">
                  <span className="tw-mono text-xs text-bay-500">HAB Risk:</span>
                  <span className={clsx('tw-mono text-xs font-bold',
                    dsStatus.habScore >= 60 ? 'text-red-600' : dsStatus.habScore >= 30 ? 'text-amber-600' : 'text-emerald-600'
                  )}>{dsStatus.habScore}/100 {dsStatus.habLevel}</span>
                </div>
              )}
              {dsStatus.flags > 0 && (
                <div className="flex items-center gap-2">
                  <span className="tw-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                    {dsStatus.flags} FLAGS
                  </span>
                </div>
              )}
              <span className="tw-mono text-[10px] text-bay-400">USGS · NOAA · NWS · ERDDAP · EPA · GCOOS · HAB · AIS · USACE</span>
            </div>
          </div>
        </Link>
      )}

      {(nerrs?.waterQuality?.available || hfradar?.available || aqi?.available) && (
        <div className="tw-card mb-4 tw-glass-tint-green">
          <div className="tw-label text-teal-600 mb-2">Live Feeds — Earthdata + Copernicus + AirNow</div>
          <div className="flex flex-wrap gap-4">
            {nerrs?.waterQuality?.available && (() => {
              const d = nerrs.waterQuality.latest || {}
              const doV = d.DO_mgl?.value
              return (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                  <div>
                    <div className="tw-label mb-0.5">NERRS Weeks Bay</div>
                    <div className="tw-mono text-sm font-bold text-teal-700">
                      {doV!=null?parseFloat(doV).toFixed(1):'—'} mg/L DO₂
                      {d.Temp?.value!=null&&<span className="text-bay-400 font-normal ml-2">{parseFloat(d.Temp.value).toFixed(1)}°C</span>}
                      {d.Sal?.value!=null&&<span className="text-bay-400 font-normal ml-2">{parseFloat(d.Sal.value).toFixed(1)} ppt</span>}
                    </div>
                  </div>
                </div>
              )
            })()}
            {hfradar?.available && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>
                <div>
                  <div className="tw-label mb-0.5">HF Radar — Bloom Transport</div>
                  <div className="tw-mono text-sm font-bold text-blue-700">
                    {hfradar.avgSpeed_ms?.toFixed(2)} m/s {hfradar.directionCardinal}
                    <span className="text-bay-400 font-normal ml-2">~{hfradar.bloom_transport?.distance_14h_km?.toFixed(0)} km in 14h</span>
                  </div>
                </div>
              </div>
            )}
            {aqi?.available && aqi.readings?.[0] && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>
                <div>
                  <div className="tw-label mb-0.5">AirNow AQI</div>
                  <div className="tw-mono text-sm font-bold text-amber-700">
                    {aqi.readings[0].aqi} AQI
                    <span className="text-bay-400 font-normal ml-2">{aqi.readings[0].category}</span>
                  </div>
                </div>
              </div>
            )}
            {(goesStatus?.status?.available || goesStatus?.status?.imageryAvailable || goesPush?.available) && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"/>
                <div>
                  <div className="tw-label mb-0.5">GOES-19 SST</div>
                  <div className="tw-mono text-sm font-bold text-orange-700">
                    {goesSst != null ? `${goesSst.toFixed(1)}°C` : goesPush?.available ? 'Push Active' : 'Active'}
                    <span className="text-bay-400 font-normal ml-2">Gulf of Mexico</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="tw-card">
          <div className="flex items-center justify-between mb-3">
            <div className="tw-label">HAB Oracle — Seasonal Probability</div>
            <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-200">★ WORLD FIRST</span>
          </div>
          {loading.hab && !habAssessment ? (
            <div className="space-y-2 py-4">
              <div className="tw-skeleton h-4 w-full" />
              <div className="tw-skeleton h-32 w-full" />
              <div className="tw-skeleton h-3 w-2/3" />
            </div>
          ) : habTimeline.length ? (
            <HABProbabilityChart data={habTimeline} />
          ) : (
            <EmptyState message="Loading HAB data..." />
          )}
          {habAssessment?.hab && (
            <div className="mt-3 pt-3 border-t border-bay-50 text-xs text-bay-400">
              {habAssessment.hab.action}
            </div>
          )}
        </div>

        <div className="tw-card">
          <div className="tw-label mb-3">Station Network Status</div>
          <div className="space-y-2">
            {(waterQuality?.usgs || []).slice(0, 5).map(s => {
              const hasData = Object.keys(s.readings || {}).length > 0
              const do2Val = safeVal(s.readings?.do_mg_l)
              return (
                <div key={s.siteNo} className="flex items-center gap-2 py-1.5 border-b border-bay-50 last:border-0">
                  <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', hasData ? 'bg-emerald-500' : 'bg-bay-300')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-bay-700 font-medium truncate">{s.name}</div>
                    <div className="tw-mono text-[9px] text-bay-300">{s.siteNo}</div>
                  </div>
                  {do2Val != null && (
                    <div className={clsx('tw-mono text-xs font-bold', do2Val < 4 ? 'text-red-600' : do2Val < 6 ? 'text-amber-600' : 'text-teal-700')}>
                      {typeof do2Val === 'number' ? do2Val.toFixed(1) : '—'} mg/L
                    </div>
                  )}
                  {safeVal(s.readings?.streamflow_cfs) !== null && (
                    <div className="tw-mono text-[10px] text-bay-400">
                      {(safeVal(s.readings.streamflow_cfs) / 1000).toFixed(0)}K cfs
                    </div>
                  )}
                </div>
              )
            })}
            {(!waterQuality?.usgs || waterQuality.usgs.length === 0) && (
              loading.water
                ? <div className="space-y-2 py-3">
                    {[1,2,3].map(i => <div key={i} className="tw-skeleton h-8 w-full rounded-lg" />)}
                  </div>
                : <EmptyState icon="≋" message="Fetching USGS station data..." />
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-bay-50 flex items-center justify-between">
            <div className="tw-label">CO-OPS Tidal Stations</div>
            <div className="tw-mono text-[9px] text-bay-300">
              {Object.keys(waterQuality?.coops || {}).length} active
            </div>
          </div>
          {Object.values(waterQuality?.coops || {}).map(s => (
            <div key={s.id} className="flex items-center gap-2 py-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-bay-500 flex-1">{s.name}</span>
              {s.water_level?.value != null && (
                <span className="tw-mono text-blue-600 font-semibold">{s.water_level.value.toFixed(1)} ft</span>
              )}
              {s.salinity?.value != null && (
                <span className="tw-mono text-purple-600 font-semibold">{s.salinity.value.toFixed(1)} ppt</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="tw-card mb-6">
        <div className="tw-label mb-3">7-Day Forecast — Open-Meteo</div>
        {forecastData.length > 0 ? (
          <WeatherForecastChart data={forecastData} />
        ) : loading.weather ? (
          <div className="space-y-2 py-4">
            <div className="tw-skeleton h-4 w-full" />
            <div className="tw-skeleton h-28 w-full" />
            <div className="tw-skeleton h-3 w-1/2" />
          </div>
        ) : (
          <EmptyState message="No forecast data available" />
        )}
      </div>

      {habAssessment?.hab && (
        <Section title="HAB Oracle Assessment Detail">
          <div className="tw-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="tw-label mb-1">Current Probability</div>
                <div className="text-3xl font-bold tw-mono" style={{ color: habProb >= 65 ? '#dc2626' : '#0a9e80' }}>
                  {habProb}%
                </div>
              </div>
              <div>
                <div className="tw-label mb-1">Risk Level</div>
                <RiskBadge level={habLevel} size="lg" />
              </div>
              <div>
                <div className="tw-label mb-1">Seasonal Prior</div>
                <div className="tw-mono text-lg font-bold text-bay-700">{habAssessment.hab.seasonalPrior}%</div>
              </div>
              <div>
                <div className="tw-label mb-1">Data Confidence</div>
                <div className="tw-mono text-sm font-bold text-teal-700">{habAssessment.hab.dataQuality?.confidence}</div>
                <div className="text-[10px] text-bay-300 tw-mono mt-0.5">
                  {habAssessment.hab.dataQuality?.inputCount}/{habAssessment.hab.dataQuality?.totalInputs} feeds
                </div>
              </div>
            </div>

            <div className="border-t border-bay-50 pt-4">
              <div className="tw-label mb-2">48–72 Hour Outlook</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '+24h', val: habAssessment.hab.outlook?.h24 },
                  { label: '+48h', val: habAssessment.hab.outlook?.h48 },
                  { label: '+72h', val: habAssessment.hab.outlook?.h72 },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center p-3 rounded-lg bg-bay-50">
                    <div className="tw-label mb-1">{label}</div>
                    <div className="tw-mono text-xl font-bold" style={{ color: val >= 65 ? '#dc2626' : val >= 45 ? '#d97706' : '#0a9e80' }}>
                      {val ?? '—'}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-bay-50 border border-bay-100">
              <div className="tw-label mb-1">Recommended Action</div>
              <div className="text-sm text-bay-600">{habAssessment.hab.action}</div>
            </div>

            <div className="mt-3 tw-mono text-[8px] text-bay-300">
              {habAssessment.hab.methodology}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}

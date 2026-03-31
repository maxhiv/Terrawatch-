import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, Section } from '../components/Common/index.jsx'
import { AirQualityChart, SatelliteTimelineChart, WeatherForecastChart, OceanConditionsChart } from '../components/Charts/index.jsx'
import clsx from 'clsx'

function safeNum(v) { if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; if(typeof v==='object'&&'value'in v)return safeNum(v.value); const n=parseFloat(v); return isNaN(n)?null:n }

const STATUS_STYLES = {
  live:     { dot:'bg-emerald-500', label:'LIVE',        cls:'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial:  { dot:'bg-amber-400',   label:'PARTIAL',     cls:'bg-amber-50 text-amber-700 border-amber-200' },
  keyed:    { dot:'bg-blue-400',    label:'KEY NEEDED',  cls:'bg-blue-50 text-blue-700 border-blue-200' },
  offline:  { dot:'bg-red-400',     label:'OFFLINE',     cls:'bg-red-50 text-red-700 border-red-200' },
  planned:  { dot:'bg-gray-300',    label:'PLANNED',     cls:'bg-gray-50 text-gray-500 border-gray-200' },
}

function FeedCard({ name, icon, status, value, unit, sub, note, worldFirst, badge }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.planned
  return (
    <div className={clsx('tw-card hover:shadow-md hover:-translate-y-0.5 transition-all', status==='offline'&&'tw-glass-tint-red')}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={clsx('w-2 h-2 rounded-full flex-shrink-0 mt-0.5', s.dot, status==='live'&&'animate-pulse')} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-bay-800 truncate">{icon} {name}</span>
              {worldFirst && <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">★</span>}
            </div>
            {badge && <div className="tw-mono text-[8px] text-bay-300 mt-0.5">{badge}</div>}
          </div>
        </div>
        <span className={clsx('tw-badge border flex-shrink-0', s.cls)}>{s.label}</span>
      </div>
      {value != null && (
        <div className="tw-mono text-xl font-bold text-bay-800 mb-1">
          {typeof value==='number'?value.toFixed(value>100?0:2):value}
          {unit && <span className="text-xs font-normal text-bay-400 ml-1">{unit}</span>}
        </div>
      )}
      {sub && <div className="text-xs text-bay-400 leading-relaxed">{sub}</div>}
      {note && <div className="text-[10px] text-bay-300 mt-1.5 leading-relaxed">{note}</div>}
    </div>
  )
}

function SectionHeader({ title, count, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="tw-mono text-[9px] font-bold tracking-[0.15em] text-bay-400 uppercase">{title}</div>
      {count != null && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold" style={{background:`${color}15`,color,border:`1px solid ${color}33`}}>{count}</span>}
    </div>
  )
}

function deriveStatus(d) {
  if (!d) return 'partial'
  if (d.available === true) return 'live'
  if (d.configured === false || d.reason?.includes('not configured')) return 'keyed'
  if (d.configured === true && d.available !== false) return 'live'
  if (d.available === false && d.configured !== true) return 'partial'
  if (d.available === false) return 'partial'
  return 'partial'
}

function normalizeCategory(payload, icons, extras = {}) {
  if (!payload) return []
  return Object.entries(payload)
    .filter(([k]) => k !== 'totalSources')
    .map(([key, data]) => ({
      key,
      name: data?.product || extras[key]?.name || key,
      icon: icons[key] || '📡',
      status: deriveStatus(data),
      value: extras[key]?.value?.(data) ?? null,
      unit: extras[key]?.unit?.(data) ?? '',
      badge: data?.note?.substring(0, 80) || extras[key]?.badge || '',
      sub: data?.reason || extras[key]?.sub?.(data) || '',
      note: data?.error || extras[key]?.note || '',
      worldFirst: extras[key]?.worldFirst || false,
    }))
}

function buildSatelliteChartData(sat) {
  if (!sat) return []
  const items = [
    { name: 'MODIS CHL', granules: sat.modis?.granules || 0, available: sat.modis?.available },
    { name: 'VIIRS OC', granules: sat.viirs?.granules || 0, available: sat.viirs?.available },
    { name: 'HLS L30', granules: sat.hls?.HLSL30?.granules || 0, available: sat.hls?.available },
    { name: 'HLS S30', granules: sat.hls?.HLSS30?.granules || 0, available: sat.hls?.available },
    { name: 'Landsat', granules: sat.landsat?.granules || 0, available: sat.landsat?.available },
    { name: 'Sentinel-2', granules: sat.sentinel2?.granules || 0, available: sat.sentinel2?.available },
  ]
  if (sat.goes?.status?.available || sat.goes?.status?.imageryAvailable) {
    items.push({ name: 'GOES-19', granules: 1, available: true })
  }
  return items
}

function buildAqiChartData(aqiData, airplusData) {
  if (!aqiData?.readings?.length && !airplusData) return []
  const airNowPM25 = aqiData?.readings?.find(r => (r.parameter||'').includes('PM2.5'))?.aqi
  const airNowO3 = aqiData?.readings?.find(r => (r.parameter||'').includes('O3') || (r.parameter||'').includes('Ozone'))?.aqi
  const openAQPM25 = safeNum(airplusData?.openAQ?.avgPM25)
  const purpleAirPM25 = safeNum(airplusData?.purpleAir?.avgPM25)
  const epaAQSVal = safeNum(airplusData?.epaAQS?.avgValue)

  const hasMulti = openAQPM25 != null || purpleAirPM25 != null || epaAQSVal != null

  if (hasMulti) {
    return [
      { parameter: 'PM2.5', airNow: airNowPM25 || null, openAQ: openAQPM25, purpleAir: purpleAirPM25, epaAQS: epaAQSVal },
      ...(airNowO3 ? [{ parameter: 'Ozone', airNow: airNowO3, openAQ: null, purpleAir: null, epaAQS: null }] : []),
    ]
  }
  if (!aqiData?.readings?.length) return []
  return aqiData.readings.map(r => ({
    parameter: r.parameter || r.ParameterName || 'AQI',
    aqi: r.aqi || r.AQI || 0,
    category: r.category || r.Category?.Name || '',
  }))
}

function buildOpenMeteoForecastData(openMeteo) {
  if (!openMeteo?.dailyForecast?.length) return []
  return openMeteo.dailyForecast.map(d => {
    const dayName = d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '?'
    const highF = d.high_c != null ? d.high_c * 9/5 + 32 : null
    const lowF = d.low_c != null ? d.low_c * 9/5 + 32 : null
    return {
      day: dayName,
      high: highF != null ? Math.round(highF) : null,
      low: lowF != null ? Math.round(lowF) : null,
      precipChance: d.precipProb || 0,
    }
  })
}

function buildOceanTimeData(oceanStatus) {
  if (!oceanStatus) return []
  const data = []
  if (oceanStatus.coastwatch?.available && oceanStatus.coastwatch.data?.table) {
    const rows = oceanStatus.coastwatch.data.table.rows || []
    const cols = oceanStatus.coastwatch.data.table.columnNames || []
    const timeIdx = cols.indexOf('time')
    const chlIdx = cols.findIndex(c => c.includes('chlor') || c.includes('chl'))
    if (rows.length > 0 && timeIdx >= 0 && chlIdx >= 0) {
      rows.forEach(r => {
        const val = safeNum(r[chlIdx])
        if (val != null) data.push({ time: r[timeIdx]?.substring(0, 10) || '', sst: val })
      })
    }
  }
  if (data.length === 0 && oceanStatus.hycom?.available) {
    data.push({ time: 'Current', sst: 0 })
  }
  return data
}

export default function FeedStatus() {
  const {
    waterQuality, weather, nerrs, hfradar, aqi,
    paceStatus, methane, openeo, sensors, epaNpdes,
    satelliteStatus, oceanStatus, ecologyStatus, landStatus, airplusStatus, goesStatus,
    loading, fetchAll, fetchNERRS, fetchHFRadar, fetchPACEStatus,
    fetchMethane, fetchOpenEO, fetchEPANPDES, fetchAQI,
    fetchSatelliteStatus, fetchOceanStatus, fetchEcologyStatus,
    fetchLandStatus, fetchAirPlusStatus, fetchGOESStatus,
  } = useStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchNERRS(); fetchHFRadar(); fetchPACEStatus(); fetchMethane(); fetchOpenEO(); fetchEPANPDES(); fetchAQI()
    fetchSatelliteStatus(); fetchOceanStatus(); fetchEcologyStatus(); fetchLandStatus(); fetchAirPlusStatus(); fetchGOESStatus()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    await Promise.all([fetchPACEStatus(), fetchMethane(), fetchOpenEO(), fetchEPANPDES()])
    setRefreshing(false)
  }

  const reg = sensors?.summary
  const totalActive = reg?.active || 0
  const totalFeeds = reg?.totalActiveFeeds || 0

  const usgsCount = waterQuality?.usgs?.filter(s=>Object.keys(s.readings||{}).length>0).length || 0
  const coopsCount = Object.keys(waterQuality?.coops||{}).length
  const buoyOk = !!waterQuality?.buoy?.WTMP
  const nerrsOk = nerrs?.waterQuality?.available
  const nDO2 = safeNum(nerrs?.waterQuality?.latest?.DO_mgl?.value)
  const nSal = safeNum(nerrs?.waterQuality?.latest?.Sal?.value)
  const nTemp = safeNum(nerrs?.waterQuality?.latest?.Temp?.value)
  const nChl = safeNum(nerrs?.waterQuality?.latest?.ChlFluor?.value)

  const hfOk = hfradar?.available
  const hfSpeed = safeNum(hfradar?.avgSpeed_ms)
  const hfDist14 = safeNum(hfradar?.bloom_transport?.distance_14h_km)

  const npdesCount = epaNpdes?.count
  const npdesViolating = epaNpdes?.violating

  const waterFeeds = [
    { key:'usgs', name:'USGS NWIS', icon:'≋', status:usgsCount>0?'live':'partial', value:usgsCount, unit:'stations', badge:'6 stations · 9 parameters · Mobile Bay', sub:waterQuality?.usgs?.map(s=>s.name?.split(' at ')[0]).join(', '), note:'No key needed' },
    { key:'coops', name:'NOAA CO-OPS', icon:'↕', status:coopsCount>0?'live':'partial', value:coopsCount, unit:'tidal stations', badge:'Dauphin Island · State Docks', sub:`${waterQuality?.coops?.['8735180']?.salinity?.value?.toFixed(1) ?? '—'} ppt salinity`, note:'No key needed' },
    { key:'buoy', name:'NDBC Buoy 42012', icon:'◎', status:buoyOk?'live':'partial', value:waterQuality?.buoy?.WTMP?.toFixed(1), unit:'°C water temp', badge:'Offshore Gulf', sub:waterQuality?.buoy?.WSPD!=null?`Wind: ${waterQuality.buoy.WSPD} m/s`:'', note:'No key needed' },
    { key:'nerrs', name:'NERRS Weeks Bay', icon:'🌿', status:nerrsOk?'live':'partial', value:nDO2?.toFixed(2), unit:'mg/L DO₂', badge:'15-min readings', worldFirst:true, sub:nerrsOk?[nTemp&&`${nTemp.toFixed(1)}°C`,nSal&&`${nSal.toFixed(1)} ppt`].filter(Boolean).join(' · '):'Fetching...', note:'No key needed' },
  ]

  const oceanIcons = { cmems:'🌏', hycom:'🌊', coastwatch:'🛟', streamstats:'💧', digitalcoast:'🏖️' }
  const oceanExtras = {
    hycom: { sub: d => d?.product || '' },
    coastwatch: { sub: d => d?.product || '' },
    cmems: { sub: d => d?.product || '' },
    streamstats: { sub: d => 'On-demand watershed delineation' },
    digitalcoast: { value: d => d?.datasets, unit: d => d?.datasets != null ? 'datasets' : '' },
  }
  const oceanFeeds = [
    { key:'hfradar', name:'HF Radar', icon:'↻', status:hfOk?'live':'offline', value:hfSpeed?.toFixed(2), unit:'m/s', badge:'Gulf surface currents', worldFirst:true, sub:hfOk?`${hfradar.directionCardinal} · ~${hfDist14?.toFixed(0)} km/14h`:'Fetching...' },
    ...normalizeCategory(oceanStatus, oceanIcons, oceanExtras),
  ]

  const goesFromSat = satelliteStatus?.goes
  const goesOk = goesFromSat?.status?.available || goesFromSat?.status?.imageryAvailable || goesStatus?.status?.available || goesStatus?.status?.imageryAvailable
  const goesSst = safeNum(goesFromSat?.status?.latestSST_C || goesStatus?.status?.latestSST_C)

  const satIcons = { modis:'🌊', viirs:'🔭', hls:'📡', landsat:'🗺️', sentinel2:'🛸', dem:'⛰️', goes:'🛰️' }
  const satExtras = {
    modis: { value: d => d?.granules, unit: () => 'granules', sub: d => d?.latest?.time ? `Latest: ${new Date(d.latest.time).toLocaleDateString()}` : '' },
    viirs: { value: d => d?.granules, unit: () => 'granules', sub: d => d?.latest ? `Latest: ${new Date(d.latest).toLocaleDateString()}` : '' },
    hls: { value: d => (d?.HLSL30?.granules||0)+(d?.HLSS30?.granules||0), unit: () => 'granules' },
    landsat: { value: d => d?.granules, unit: () => 'granules', sub: d => d?.latest?.time ? `Latest: ${new Date(d.latest.time).toLocaleDateString()}` : '' },
    sentinel2: { value: d => d?.granules, unit: () => 'granules', sub: d => d?.latest?.cloudPct != null ? `Cloud: ${d.latest.cloudPct}%` : '' },
    goes: { name:'GOES-19 ABI', value: () => goesSst?.toFixed(1), unit: () => goesSst!=null?'°C SST':'', sub: () => 'Geostationary · 2km hourly · No key' },
  }
  const satFeedsFromComposite = normalizeCategory(satelliteStatus, satIcons, satExtras)
  const extraSatFeeds = [
    { key:'pace', name:'NASA PACE OCI', icon:'🛰️', status:paceStatus?.configured?'live':!paceStatus?'partial':'keyed', worldFirst:true, badge:'PACE OCI v3.1 · Karenia 588nm', sub:paceStatus?.configured?'Credentials active':'NASA_EARTHDATA_USER+PASS' },
    { key:'tropomi', name:'TROPOMI CH4', icon:'🌡️', status:methane?.configured?'live':!methane?'partial':'keyed', badge:'Sentinel-5P · 5.5km daily', sub:methane?.configured?'TROPOMI operational':'COPERNICUS_USER+PASS' },
  ]
  const satFeeds = [...satFeedsFromComposite, ...extraSatFeeds]

  const ecoIcons = { iNaturalist:'🦎', gbif:'🌍', eBird:'🐦', ameriflux:'🏗️' }
  const ecoExtras = {
    iNaturalist: { value: d => d?.totalCount, unit: () => 'observations', sub: d => `${d?.daysBack||7}-day window` },
    gbif: { value: d => d?.totalCount, unit: () => 'occurrences', sub: () => '90-day window' },
    eBird: { value: d => d?.mobileBayObs ?? d?.totalAlabamaObs, unit: d => d?.mobileBayObs != null ? 'Mobile Bay obs' : 'obs', sub: d => d?.available ? `${d?.species?.length||0} species` : 'EBIRD_API_KEY required' },
    ameriflux: { worldFirst: true, sub: d => d?.nearestSite || 'CO₂/CH₄ flux towers' },
  }
  const ecoFeeds = normalizeCategory(ecologyStatus, ecoIcons, ecoExtras)

  const airIcons = { epaAQS:'📊', openAQ:'🌐', purpleAir:'💜' }
  const airExtras = {
    openAQ: {
      value: d => safeNum(d?.avgPM25),
      unit: d => d?.avgPM25 != null ? 'µg/m³ PM2.5' : '',
      sub: d => d?.available ? `${d?.readings?.length || d?.locationCount || 0} readings/locations` : 'No data',
    },
    purpleAir: {
      value: d => safeNum(d?.avgPM25),
      unit: d => d?.avgPM25 != null ? 'µg/m³ PM2.5' : '',
      sub: d => d?.available ? `${d?.sensorCount || 0} sensors in area` : d?.configured===false ? 'PURPLEAIR_API_KEY required' : '',
    },
    epaAQS: {
      value: d => safeNum(d?.avgValue),
      unit: d => d?.avgValue != null ? 'µg/m³' : '',
      sub: d => d?.configured===false ? 'AQS_EMAIL + AQS_API_KEY required' : `${d?.records || 0} records`,
    },
  }
  const airFeeds = [
    { key:'nws', name:'NOAA NWS', icon:'≈', status:weather?.current?.temp_f!=null?'live':'partial', value:weather?.current?.temp_f?.toFixed(1), unit:'°F', badge:'Mobile Bay forecast', sub:weather?.current?.description || 'Fetching...' },
    { key:'airnow', name:'AirNow AQI', icon:'🌬️', status:aqi?.available?'live':aqi?.configured===false?'keyed':'partial', value:aqi?.readings?.[0]?.aqi, unit:'AQI', badge:'Dauphin Island + Mobile', sub:aqi?.available?`${aqi.readings?.[0]?.category} — ${aqi.readings?.map(r=>r.parameter).join(', ')}`:'Add AIRNOW_API_KEY' },
    ...normalizeCategory(airplusStatus, airIcons, airExtras),
  ]

  const landIcons = { openMeteo:'☀️', ahps:'🌊', ncei:'📁', ssurgo:'🌱', nwi:'🌾', fema:'🗺️', nlcd:'🛤️', attains:'📊', usace:'⚖️' }
  const landExtras = {
    openMeteo: { value: d => safeNum(d?.current?.temp_c), unit: d => d?.current?.temp_c != null ? '°C' : '' },
    ahps: { value: d => safeNum(d?.stage), unit: d => d?.stage != null ? 'ft' : '' },
    ncei: { sub: d => d?.configured===false ? 'NCEI_API_KEY required' : '' },
  }
  const landFeeds = [
    ...normalizeCategory(landStatus, landIcons, landExtras),
    { key:'echo', name:'EPA ECHO', icon:'📋', status:npdesCount>0?'live':'partial', value:npdesCount, unit:'NPDES permits', badge:'Discharge compliance', sub:npdesViolating>0?`⚠ ${npdesViolating} with violations`:'', note:'' },
    { key:'wqp', name:'WQ Portal', icon:'⬡', status:'live', badge:'USGS + EPA + state WQP', sub:'Unified water quality queries' },
    { key:'tri', name:'EPA TRI', icon:'⚠', status:'live', badge:'Toxic Release Inventory', sub:'Chemical releases · Mobile County' },
  ]

  const satChartData = buildSatelliteChartData(satelliteStatus)
  const aqiChartData = buildAqiChartData(aqi, airplusStatus)
  const openMeteoForecast = buildOpenMeteoForecastData(landStatus?.openMeteo)
  const oceanChartData = buildOceanTimeData(oceanStatus)

  const openeoOk = openeo?.platform?.configured

  function renderFeedGrid(feeds) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {feeds.map(({ key, ...rest }) => <FeedCard key={key} {...rest} />)}
      </div>
    )
  }

  const liveCount = feeds => feeds.filter(f => f.status === 'live').length

  return (
    <div className="p-6 max-w-7xl animate-in">
      <PageHeader
        icon="⊞"
        title="Feed Status"
        subtitle="All environmental data streams — live status + readings"
        badge={`${totalActive || '—'} active · ${totalFeeds || '—'} feeds`}
        actions={
          <button onClick={handleRefresh} disabled={refreshing} className="tw-btn-primary disabled:opacity-50">
            {refreshing ? <Spinner size={14}/> : '↺'} Refresh All
          </button>
        }
      />

      <SectionHeader title="Water Quality & Tidal" count={`${liveCount(waterFeeds)}/${waterFeeds.length} live`} color="#0a9e80" />
      {renderFeedGrid(waterFeeds)}

      <SectionHeader title="Weather & Atmospheric" count={`${liveCount(airFeeds)}/${airFeeds.length} live`} color="#7c3aed" />
      {renderFeedGrid(airFeeds)}

      {aqiChartData.length > 0 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Air Quality — Multi-Source Comparison (AirNow · OpenAQ · PurpleAir · EPA AQS)</div>
          <AirQualityChart data={aqiChartData} />
        </div>
      )}

      {openMeteoForecast.length > 0 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">7-Day Forecast — Open-Meteo (Mobile Bay)</div>
          <WeatherForecastChart data={openMeteoForecast} />
        </div>
      )}

      <SectionHeader title="Currents & Ocean Models" count={`${liveCount(oceanFeeds)}/${oceanFeeds.length} live`} color="#1d6fcc" />
      {renderFeedGrid(oceanFeeds)}

      {hfOk && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Ocean Surface Currents — HF Radar Real-Time</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l:'Speed', v:hfSpeed?.toFixed(2), u:'m/s' },
              { l:'Speed', v:hfradar.avgSpeed_knots?.toFixed(2), u:'knots' },
              { l:'Direction', v:hfradar.direction_deg, u:`° (${hfradar.directionCardinal})` },
              { l:'Transport 14h', v:hfDist14?.toFixed(0), u:'km' },
              { l:'Transport 24h', v:safeNum(hfradar.bloom_transport?.distance_24h_km)?.toFixed(0), u:'km' },
            ].map(s=>(
              <div key={s.l+s.u} className="text-center p-2.5 rounded-lg bg-bay-50">
                <div className="tw-label mb-0.5">{s.l}</div>
                <div className="tw-mono text-lg font-bold text-teal-700">{s.v??'—'}<span className="text-[10px] font-normal text-bay-400 ml-1">{s.u}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {oceanChartData.length > 1 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Ocean Conditions — CoastWatch Chlorophyll-a</div>
          <OceanConditionsChart data={oceanChartData} />
        </div>
      )}

      <SectionHeader title="Satellite Imagery & Remote Sensing" count={`${liveCount(satFeeds)}/${satFeeds.length} live`} color="#d97706" />
      {renderFeedGrid(satFeeds)}

      {satChartData.length > 0 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Satellite Granule Availability — Recent</div>
          <SatelliteTimelineChart data={satChartData} />
        </div>
      )}

      {(goesFromSat?.imagery?.available || goesStatus?.imagery?.available) && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">GOES-19 Gulf of Mexico — Latest GEOCOLOR</div>
          <div className="flex items-center gap-4 flex-wrap">
            <a href={(goesFromSat?.imagery || goesStatus?.imagery)?.imageUrl} target="_blank" rel="noreferrer" className="tw-btn-primary text-xs">View Latest Image →</a>
            <a href={(goesFromSat?.imagery || goesStatus?.imagery)?.animationUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">View Animation (GIF) →</a>
            <span className="tw-mono text-[9px] text-bay-300">Refresh: {(goesFromSat?.imagery || goesStatus?.imagery)?.refreshRate}</span>
          </div>
        </div>
      )}

      <SectionHeader title="Ecology & Biodiversity" count={`${liveCount(ecoFeeds)}/${ecoFeeds.length} live`} color="#16a34a" />
      {renderFeedGrid(ecoFeeds)}

      {ecoFeeds.some(f => f.status === 'live') && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Biodiversity Summary — Mobile Bay Region</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ecoFeeds.filter(f => f.status === 'live' && f.value != null).map((f, i) => (
              <div key={f.name || i} className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="tw-label mb-1 text-emerald-600">{f.name}</div>
                <div className="tw-mono text-2xl font-bold text-emerald-700">{typeof f.value === 'number' ? f.value.toLocaleString() : f.value}</div>
                <div className="text-[10px] text-bay-400 mt-1">{f.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader title="Land & Regulatory" count={`${liveCount(landFeeds)}/${landFeeds.length} live`} color="#92400e" />
      {renderFeedGrid(landFeeds)}

      {openeoOk && openeo?.algorithms && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Copernicus openEO Algorithm Plaza</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(openeo?.platform?.algorithms || []).slice(0,8).map(alg => (
              <div key={alg.id} className={clsx('p-2.5 rounded-lg border text-xs', alg.terrawatch?.priority==='CRITICAL'?'border-red-200 bg-red-50':'border-bay-100 bg-bay-50')}>
                <div className="font-semibold text-bay-800 mb-0.5">{alg.id}</div>
                <div className="text-[10px] text-bay-400 mb-1">{alg.provider} · {alg.resolution}</div>
                <div className={clsx('tw-mono text-[8px] font-bold', alg.terrawatch?.priority==='CRITICAL'?'text-red-600':'text-bay-400')}>
                  {alg.terrawatch?.priority || 'MEDIUM'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nerrsOk && nerrs?.waterQuality?.latest && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Weeks Bay NERR — Full Parameter Reading
            <span className="ml-2 text-bay-300 font-normal normal-case tw-mono text-[9px]">{nerrs.waterQuality.latestTimestamp}</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(nerrs.waterQuality.latest).map(([k, v]) => (
              <div key={k} className="text-center p-2 rounded-lg bg-bay-50">
                <div className="tw-label mb-0.5">{v.label}</div>
                <div className="tw-mono text-base font-bold text-bay-800">
                  {safeNum(v.value)?.toFixed(2) ?? '—'}
                  {v.unit && <span className="text-[9px] font-normal text-bay-400 ml-0.5">{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionHeader title="Planned — Hardware + Partnership" count={null} color="#7c3aed" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { name:'eDNA Auto-Samplers', icon:'🧬', when:'Month 6', note:'HAB species before visual detection', worldFirst:true },
          { name:'Passive Acoustic', icon:'🔊', when:'Month 4', note:'Fish spawning condition forecast' },
          { name:'LoRaWAN Soil', icon:'🌱', when:'Month 3', note:'Saltwater intrusion warning' },
          { name:'MS4 Stormwater IoT', icon:'🌧️', when:'Month 4', note:'Nonpoint source loading network' },
          { name:'WBE (MAWSS)', icon:'🏥', when:'Year 2', note:'HAB brevetoxin human exposure', worldFirst:true },
        ].map(s=>(
          <div key={s.name} className="tw-card border-dashed border-bay-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"/>
              <div className="text-sm font-semibold text-bay-600">{s.icon} {s.name}</div>
              {s.worldFirst && <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">★</span>}
            </div>
            <div className="tw-mono text-[9px] text-amber-600 font-bold mb-1">{s.when}</div>
            <div className="text-[10px] text-bay-400 leading-relaxed">{s.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

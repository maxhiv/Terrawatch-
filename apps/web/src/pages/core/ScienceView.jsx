import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../store/index.js'
import { PageHeader, Spinner, RiskBadge } from '../../components/common/index.jsx'
import { WeatherForecastChart, AirQualityChart, SatelliteTimelineChart, OceanConditionsChart } from '../../components/charts/index.jsx'
import { AreaChart, Area, LineChart, Line, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell, Legend } from 'recharts'
import clsx from 'clsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

function safeNum(v) { if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; if(typeof v==='object'&&'value'in v)return safeNum(v.value); const n=parseFloat(v); return isNaN(n)?null:n }
function doColor(v) { return v==null?'#4a7060':v<3?'#dc2626':v<5?'#f59e0b':'#10b981' }
function fmtTime(ts) { try{return new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}catch{return ts} }
function fmtDate(ts) { try{return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'})}catch{return ts} }

const PARAMS = {
  do_mg_l:           { label:'DO₂',         unit:'mg/L', color:'#10b981', critLow:3, warnLow:5  },
  water_temp_c:      { label:'Temperature',  unit:'°C',   color:'#f59e0b', critHigh:30 },
  streamflow_cfs:    { label:'Streamflow',   unit:'cfs',  color:'#3b82f6' },
  gage_height_ft:    { label:'Gage Height',  unit:'ft',   color:'#0ea5e9' },
  pH:                { label:'pH',           unit:'',     color:'#7c3aed', warnLow:6.5, warnHigh:8.5 },
  turbidity_ntu:     { label:'Turbidity',    unit:'NTU',  color:'#d97706', warnHigh:10, critHigh:25 },
  conductance_us_cm: { label:'Conductance',  unit:'µS/cm',color:'#1d6fcc' },
  salinity_ppt:      { label:'Salinity',     unit:'ppt',  color:'#7c3aed' },
  chlorophyll_ugl:   { label:'Chlorophyll',  unit:'µg/L', color:'#16a34a', warnHigh:20, critHigh:40 },
}

const USGS_SITES = {
  '02428400':'Alabama River at Claiborne',
  '02469761':'Mobile River at I-65',
  '02469800':'Mobile River near Bucks',
  '02471078':'Escatawpa River',
  '02479000':'Dog River near Mobile',
  '02479155':'Fowl River',
}
const PARAM_CODES = { do_mg_l:'00300', water_temp_c:'00010', streamflow_cfs:'00060', pH:'00400', turbidity_ntu:'00076', conductance_us_cm:'00095' }

function timeAgo(ts) {
  if (!ts) return null
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return `${Math.floor(diff/86400000)}d ago`
}

function StatBox({ label, value, unit, color, sub, freshness }) {
  return (
    <div className="text-center p-2.5 rounded-lg tw-glass">
      <div className="tw-label mb-0.5">{label}</div>
      <div className="tw-mono text-base font-bold" style={{color:color||'#1a3028'}}>{value??'—'}{unit&&<span className="text-[10px] font-normal text-bay-400 ml-0.5">{unit}</span>}</div>
      {sub&&<div className="text-[9px] text-bay-400 mt-0.5">{sub}</div>}
      {freshness && <div className="text-[8px] text-bay-300 mt-0.5">{timeAgo(freshness)}</div>}
    </div>
  )
}

function DoGauge({ value }) {
  const pct = Math.min(100, Math.max(0, ((value||0)/14)*100))
  const color = doColor(value)
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e2f0ea" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${pct * 1.571} 157.1`}/>
        <line x1="60" y1="60" x2={60+44*Math.cos(Math.PI-(pct/100)*Math.PI)} y2={60-44*Math.sin(Math.PI-(pct/100)*Math.PI)} stroke="#1a3028" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="60" cy="60" r="4" fill="#1a3028"/>
      </svg>
      <div className="tw-mono text-xl font-bold -mt-2" style={{color}}>{value!=null?value.toFixed(1):'—'}</div>
      <div className="tw-label">mg/L DO₂</div>
      {value!=null&&<div className="text-[10px] mt-0.5 font-semibold" style={{color}}>{value<3?'CRITICAL — Hypoxic':value<5?'LOW — Stress':value<7?'Moderate':'Good'}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div className="tw-card shadow-md py-2 px-3 text-xs" style={{minWidth:120}}>
      <div className="text-bay-400 mb-1 tw-mono">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background:p.color||p.fill}}/>
          <span className="text-bay-600">{p.name}:</span>
          <span className="font-bold text-bay-900 tw-mono">{typeof p.value==='number'?p.value.toFixed(2):p.value}</span>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ title, badge }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <div className="tw-mono text-[9px] font-bold tracking-[0.15em] text-bay-400 uppercase">{title}</div>
      {badge && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-100">{badge}</span>}
    </div>
  )
}

export default function ScienceView() {
  const {
    waterQuality, habAssessment, fetchAll, loading, weather,
    nerrs, hfradar, aqi, goesStatus, ecologyStatus, sensors,
    satelliteStatus, oceanStatus, landStatus, airplusStatus,
    fetchNERRS, fetchHFRadar, fetchAQI, fetchGOESStatus,
    fetchEcologyStatus, fetchSatelliteStatus, fetchOceanStatus,
    fetchLandStatus, fetchAirPlusStatus,
    lastFetchedAt,
  } = useStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSite, setSelectedSite] = useState('02479000')
  const [selectedParam, setSelectedParam] = useState('do_mg_l')
  const [histData, setHistData] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [histDays, setHistDays] = useState(7)

  useEffect(() => {
    fetchAll()
    fetchNERRS(); fetchHFRadar(); fetchAQI(); fetchGOESStatus()
    fetchEcologyStatus(); fetchSatelliteStatus(); fetchOceanStatus()
    fetchLandStatus(); fetchAirPlusStatus()
  }, [])

  const loadHistorical = useCallback(async () => {
    const paramCode = PARAM_CODES[selectedParam]
    if (!paramCode || !selectedSite) return
    setHistLoading(true)
    try {
      const res = await fetch(`${API}/api/water/historical/${selectedSite}/${paramCode}?days=${histDays}`)
      const d = await res.json()
      setHistData(d.data || [])
    } catch(e) { console.error(e) }
    finally { setHistLoading(false) }
  }, [selectedSite, selectedParam, histDays])

  useEffect(() => { loadHistorical() }, [loadHistorical])

  const usgs = waterQuality?.usgs || []
  const coops = waterQuality?.coops || {}

  const nDO = safeNum(nerrs?.waterQuality?.latest?.DO_mgl?.value)
  const nTemp = safeNum(nerrs?.waterQuality?.latest?.Temp?.value)
  const nSal = safeNum(nerrs?.waterQuality?.latest?.Sal?.value)
  const nChl = safeNum(nerrs?.waterQuality?.latest?.ChlFluor?.value)
  const nTurb = safeNum(nerrs?.waterQuality?.latest?.Turb?.value)
  const nPH = safeNum(nerrs?.waterQuality?.latest?.pH?.value)
  const nSpCond = safeNum(nerrs?.waterQuality?.latest?.SpCond?.value)
  const nerrsOk = nerrs?.waterQuality?.available
  const nerrsAttempted = nerrs != null

  const allDO = [...usgs.map(s=>safeNum(s.readings?.do_mg_l)).filter(v=>v!=null), ...(nDO!=null?[nDO]:[])]
  const allTemp = [...usgs.map(s=>safeNum(s.readings?.water_temp_c)).filter(v=>v!=null), ...(nTemp!=null?[nTemp]:[])]
  const allFlow = usgs.map(s=>safeNum(s.readings?.streamflow_cfs)).filter(v=>v!=null)
  const totalFlow = allFlow.length ? allFlow.reduce((a,b)=>a+b,0) : null
  const minDO = allDO.length ? Math.min(...allDO) : null
  const avgDO = allDO.length ? allDO.reduce((a,b)=>a+b,0)/allDO.length : null
  const maxDO = allDO.length ? Math.max(...allDO) : null
  const coopsArr = Object.values(coops)
  const coopsWL = coopsArr.map(s=>safeNum(s.water_level)).filter(v=>v!=null)
  const coopsTemp = coopsArr.map(s=>safeNum(s.water_temperature)).filter(v=>v!=null)
  const coopsSal = coopsArr.map(s=>safeNum(s.salinity)).filter(v=>v!=null)

  const goesSst = safeNum(goesStatus?.status?.latestSST_C) ?? safeNum(goesStatus?.push?.sst_mean)
  const goesSstSource = goesStatus?.status?.source === 'push' || (safeNum(goesStatus?.status?.latestSST_C) == null && safeNum(goesStatus?.push?.sst_mean) != null) ? 'push' : 'erddap'
  const goesImagery = goesStatus?.imagery?.available || goesStatus?.status?.imageryAvailable
  const _goesPushRaw = goesStatus?.push
  const goesPush = _goesPushRaw ? {
    ..._goesPushRaw,
    sst_mean: safeNum(_goesPushRaw.sst_mean),
    sst_gradient: safeNum(_goesPushRaw.sst_gradient),
    qpe_rainfall: safeNum(_goesPushRaw.qpe_rainfall),
    qpe_6h: safeNum(_goesPushRaw.qpe_6h),
    qpe_24h: safeNum(_goesPushRaw.qpe_24h),
    cloud_coverage: safeNum(_goesPushRaw.cloud_coverage),
    glm_flashes: safeNum(_goesPushRaw.glm_flashes),
    bloom_index: safeNum(_goesPushRaw.bloom_index),
    amv_wind_speed: safeNum(_goesPushRaw.amv_wind_speed),
    amv_wind_dir: safeNum(_goesPushRaw.amv_wind_dir),
    turbidity_idx: safeNum(_goesPushRaw.turbidity_idx),
  } : null
  const aqiVal = aqi?.readings?.[0]?.aqi
  const aqiCat = aqi?.readings?.[0]?.category

  const hfOk = hfradar?.available
  const hfSpeed = safeNum(hfradar?.avgSpeed_ms)
  const hfDir = hfradar?.directionCardinal
  const hfDist14 = safeNum(hfradar?.bloom_transport?.distance_14h_km)
  const hfDist24 = safeNum(hfradar?.bloom_transport?.distance_24h_km)

  const inatCount = ecologyStatus?.iNaturalist?.totalCount
  const gbifCount = ecologyStatus?.gbif?.totalCount
  const ebirdObs = ecologyStatus?.eBird?.mobileBayObs ?? ecologyStatus?.eBird?.totalAlabamaObs
  const ebirdSpecies = ecologyStatus?.eBird?.species?.length

  const openMeteo = landStatus?.openMeteo
  const omTemp = safeNum(openMeteo?.current?.temp_c) ?? safeNum(weather?.current?.temp_c)
  const omWind = safeNum(openMeteo?.current?.wind_ms) ?? safeNum(weather?.current?.wind_mph)
  const omCape = safeNum(openMeteo?.current?.cape)

  const purpleAirSensors = airplusStatus?.purpleAir?.sensors || []
  const validPM25 = purpleAirSensors.map(s => safeNum(s.pm25)).filter(v => v != null)
  const purpleAirAvg = validPM25.length
    ? validPM25.reduce((sum, v) => sum + v, 0) / validPM25.length
    : safeNum(airplusStatus?.purpleAir?.avgPM25)

  const hycomActive = oceanStatus?.hycom?.available
  const cmemsActive = oceanStatus?.cmems?.available

  const forecastData = openMeteo?.dailyForecast?.map(d => {
    const dayName = d.date ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '?'
    return { day: dayName, high: d.high_c != null ? Math.round(d.high_c * 9/5 + 32) : null, low: d.low_c != null ? Math.round(d.low_c * 9/5 + 32) : null, precipChance: d.precipProb || 0 }
  }) || []

  const satChartData = (() => {
    if (!satelliteStatus) return []
    const items = [
      { name: 'MODIS CHL', granules: satelliteStatus.modis?.granules || 0, available: satelliteStatus.modis?.available },
      { name: 'VIIRS OC', granules: satelliteStatus.viirs?.granules || 0, available: satelliteStatus.viirs?.available },
      { name: 'HLS', granules: (satelliteStatus.hls?.HLSL30?.granules||0) + (satelliteStatus.hls?.HLSS30?.granules||0), available: satelliteStatus.hls?.available },
      { name: 'Landsat', granules: satelliteStatus.landsat?.granules || 0, available: satelliteStatus.landsat?.available },
      { name: 'Sentinel-2', granules: satelliteStatus.sentinel2?.granules || 0, available: satelliteStatus.sentinel2?.available },
    ]
    if (satelliteStatus.goes?.status?.available || satelliteStatus.goes?.status?.imageryAvailable) items.push({ name: 'GOES-19', granules: 1, available: true })
    return items
  })()

  const aqiChartData = (() => {
    const airNowPM25 = aqi?.readings?.find(r => (r.parameter||'').includes('PM2.5'))?.aqi
    const airNowO3 = aqi?.readings?.find(r => (r.parameter||'').includes('O3') || (r.parameter||'').includes('Ozone'))?.aqi
    const openAQPM25 = safeNum(airplusStatus?.openAQ?.avgPM25)
    const purpleAirPM25 = safeNum(airplusStatus?.purpleAir?.avgPM25)
    const epaAQSVal = safeNum(airplusStatus?.epaAQS?.avgValue)
    const hasMulti = openAQPM25 != null || purpleAirPM25 != null || epaAQSVal != null
    if (hasMulti) return [
      { parameter: 'PM2.5', airNow: airNowPM25 || null, openAQ: openAQPM25, purpleAir: purpleAirPM25, epaAQS: epaAQSVal },
      ...(airNowO3 ? [{ parameter: 'Ozone', airNow: airNowO3 }] : []),
    ]
    if (!aqi?.readings?.length) return []
    return aqi.readings.map(r => ({ parameter: r.parameter || 'AQI', aqi: r.aqi || 0, category: r.category || '' }))
  })()

  const comparisonData = usgs.filter(s=>safeNum(s.readings?.[selectedParam])!=null).map(s=>({
    name: s.name.split(' at ')[0].split(' near ')[0].substring(0,14),
    value: safeNum(s.readings?.[selectedParam]),
    siteNo: s.siteNo,
  }))

  const histVals = histData.map(d=>d.value).filter(v=>v!=null&&!isNaN(v))
  const histMin = histVals.length ? Math.min(...histVals) : null
  const histMax = histVals.length ? Math.max(...histVals) : null
  const histMean = histVals.length ? histVals.reduce((a,b)=>a+b,0)/histVals.length : null
  const histStd = histVals.length && histMean!=null ? Math.sqrt(histVals.map(v=>(v-histMean)**2).reduce((a,b)=>a+b,0)/histVals.length) : null

  const pmeta = PARAMS[selectedParam]

  const exportCSV = () => {
    const rows = [['timestamp','value',pmeta?.unit||'']]
    histData.forEach(d=>rows.push([d.timestamp, d.value]))
    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `terrawatch_${selectedSite}_${selectedParam}_${histDays}d.csv`
    a.click()
  }

  const exportAllCSV = () => {
    const rows = [['source','station','parameter','value','unit','timestamp']]
    usgs.forEach(s=>{
      Object.entries(s.readings||{}).forEach(([param,reading])=>{
        const v = safeNum(reading)
        const meta = PARAMS[param]
        if(v!=null) rows.push(['USGS', s.name, meta?.label||param, v, meta?.unit||(reading?.unit)||'', s.timestamp||(reading?.dateTime)||''])
      })
    })
    if (nerrsOk && nerrs?.waterQuality?.latest) {
      Object.entries(nerrs.waterQuality.latest).forEach(([k, v]) => {
        const val = safeNum(v.value)
        if (val != null) rows.push(['NERRS Weeks Bay', 'Weeks Bay', v.label || k, val, v.unit || '', nerrs.waterQuality.latestTimestamp || ''])
      })
    }
    Object.values(coops).forEach(s => {
      if (safeNum(s.water_level) != null) rows.push(['CO-OPS', s.name, 'Water Level', safeNum(s.water_level), 'ft MLLW', ''])
      if (safeNum(s.water_temperature) != null) rows.push(['CO-OPS', s.name, 'Temperature', safeNum(s.water_temperature), '°F', ''])
      if (safeNum(s.salinity) != null) rows.push(['CO-OPS', s.name, 'Salinity', safeNum(s.salinity), 'ppt', ''])
    })
    if (goesSst != null) rows.push(['GOES-19', 'Gulf of Mexico', 'SST', goesSst, '°C', goesSstSource === 'push' ? 'Push pipeline' : 'ERDDAP'])
    if (goesPush?.sst_gradient != null) rows.push(['GOES-19', 'Gulf of Mexico', 'SST Gradient', goesPush.sst_gradient, '°C', 'Push pipeline'])
    if (goesPush?.qpe_rainfall != null) rows.push(['GOES-19', 'Gulf of Mexico', 'QPE Rainfall', goesPush.qpe_rainfall, 'mm', 'Push pipeline'])
    if (goesPush?.cloud_coverage != null) rows.push(['GOES-19', 'Gulf of Mexico', 'Cloud Cover', goesPush.cloud_coverage, '%', 'Push pipeline'])
    if (goesPush?.glm_flashes != null) rows.push(['GOES-19', 'Gulf of Mexico', 'GLM Flashes', goesPush.glm_flashes, 'count', 'Push pipeline'])
    if (goesPush?.bloom_index != null) rows.push(['GOES-19', 'Gulf of Mexico', 'Bloom Index', goesPush.bloom_index, '', 'Push pipeline'])
    if (aqiVal != null) rows.push(['AirNow', 'Mobile Bay', 'AQI', aqiVal, '', ''])
    if (hfSpeed != null) rows.push(['HF Radar', 'Gulf Surface', 'Current Speed', hfSpeed, 'm/s', ''])
    if (omTemp != null) rows.push(['Open-Meteo', 'Mobile Bay', 'Air Temp', omTemp, '°C', ''])
    if (inatCount != null) rows.push(['iNaturalist', 'Mobile Bay', 'Observations', inatCount, '', ''])
    if (gbifCount != null) rows.push(['GBIF', 'Mobile Bay', 'Occurrences', gbifCount, '', ''])
    if (ebirdObs != null) rows.push(['eBird', 'Alabama', 'Observations', ebirdObs, '', ''])
    purpleAirSensors.forEach(s => {
      if (s.pm25 != null) rows.push(['PurpleAir', s.name, 'PM2.5', s.pm25, 'µg/m³', s.lastSeen ? new Date(s.lastSeen * 1000).toISOString() : ''])
    })
    if (omCape != null) rows.push(['Open-Meteo', 'Mobile Bay', 'CAPE', omCape, 'J/kg', ''])
    if (omWind != null) rows.push(['Open-Meteo', 'Mobile Bay', 'Wind Speed', omWind, openMeteo?.current?.wind_ms != null ? 'm/s' : 'mph', ''])
    if (goesImagery) rows.push(['GOES-19', 'Gulf of Mexico', 'Imagery', 'Active', '', ''])
    if (ebirdSpecies != null) rows.push(['eBird', 'Mobile Bay', 'Species Count', ebirdSpecies, '', ''])
    if (hycomActive) rows.push(['HYCOM', 'Gulf of Mexico', 'Ocean Model', 'Active', '', ''])
    if (cmemsActive) rows.push(['CMEMS', 'Gulf of Mexico', 'Marine Service', 'Active', '', ''])

    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `terrawatch_all_sources_snapshot.csv`
    a.click()
  }

  const TABS = ['overview','time series','station compare','correlation','export']

  const totalSources = (sensors?.summary?.active || 0)

  return (
    <div className="p-5 max-w-7xl animate-in">
      <PageHeader icon="⬢" title="Science View"
        subtitle={`Multi-source analysis · ${totalSources} active feeds · Historical trends · Statistical summary · Data export`}
        badge="SCIENTIST TOOLS"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportAllCSV} className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors">
              ↓ Export All CSV
            </button>
            <button onClick={()=>{fetchAll();fetchNERRS();fetchHFRadar();fetchAQI();fetchGOESStatus();fetchEcologyStatus();fetchSatelliteStatus();fetchOceanStatus();fetchLandStatus();fetchAirPlusStatus()}} disabled={loading.water} className="tw-btn-primary disabled:opacity-50">
              {loading.water?<Spinner size={14}/>:'↺'} Refresh
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-5">
        <StatBox label="Total Streamflow" value={totalFlow != null ? (totalFlow/1000).toFixed(1) : null} unit="K cfs" color="#3b82f6" sub={`${allFlow.length} USGS stations`} freshness={lastFetchedAt.water} />
        <StatBox label="CO-OPS Tide" value={coopsWL.length ? coopsWL[0].toFixed(2) : null} unit="ft MLLW" color="#1d6fcc" sub={`${coopsArr.length} tidal stations`} freshness={lastFetchedAt.water} />
        <StatBox label="GOES-19 SST" value={goesSst?.toFixed(1) || (goesImagery ? 'Imagery' : null)} unit={goesSst != null ? '°C' : ''} color="#1d6fcc" sub={goesSst != null ? (goesSstSource === 'push' ? 'Push pipeline · 5-min' : 'Gulf hourly') : goesImagery ? 'SST offline · Imagery active' : 'Gulf hourly'} freshness={lastFetchedAt.goes} />
        <StatBox label="Air Quality" value={aqiVal ?? (purpleAirAvg != null ? purpleAirAvg.toFixed(0) : null)} unit={aqiVal != null ? 'AQI' : purpleAirAvg != null ? 'PM2.5' : 'AQI'} color={aqiVal!=null&&aqiVal>100?'#dc2626':'#10b981'} sub={aqiCat || (purpleAirAvg != null ? `PurpleAir ${purpleAirSensors.length} sensors` : 'AirNow')} freshness={lastFetchedAt.aqi} />
        <StatBox label="PurpleAir PM2.5" value={purpleAirAvg?.toFixed(1)} unit="µg/m³" color={purpleAirAvg != null && purpleAirAvg > 12 ? '#dc2626' : '#3b82f6'} sub={`${purpleAirSensors.length} local sensors`} freshness={lastFetchedAt.sensors} />
        <StatBox label="Water Temp" value={allTemp.length?(allTemp.reduce((a,b)=>a+b,0)/allTemp.length).toFixed(1):coopsTemp.length?((coopsTemp.reduce((a,b)=>a+b,0)/coopsTemp.length-32)*5/9).toFixed(1):omTemp?.toFixed(1)} unit="°C" color="#f59e0b" sub={allTemp.length?`${allTemp.length} USGS`:coopsTemp.length?`${coopsTemp.length} CO-OPS`:'Open-Meteo'} freshness={lastFetchedAt.water} />
        <StatBox label="Wind" value={omWind?.toFixed(1)} unit={openMeteo?.current?.wind_ms != null ? "m/s" : "mph"} color="#3b82f6" sub={`Dir: ${safeNum(openMeteo?.current?.wind_dir) ?? '—'}°`} freshness={lastFetchedAt.weather} />
        {allDO.length > 0 ? (
          <StatBox label="Min DO₂" value={minDO?.toFixed(1)} unit="mg/L" color={doColor(minDO)} sub={`${allDO.length} sources`} freshness={lastFetchedAt.water} />
        ) : (
          <StatBox label="CAPE" value={omCape?.toFixed(0)} unit="J/kg" color={omCape!=null&&omCape>1000?'#dc2626':'#7c3aed'} sub="Convective" freshness={lastFetchedAt.weather} />
        )}
        <StatBox label="HAB Risk" value={habAssessment?.hab?.probability} unit="%" color={habAssessment?.hab?.probability>=65?'#dc2626':'#0a9e80'}
          sub={habAssessment?.hab?.riskLevel?<RiskBadge level={habAssessment.hab.riskLevel}/>:null} freshness={lastFetchedAt.hab} />
      </div>

      <div className="flex gap-0 border-b border-bay-100 mb-4 overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            className={clsx('px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize',
              activeTab===t?'border-teal-600 text-teal-700':'border-transparent text-bay-400 hover:text-bay-600')}>
            {t}
          </button>
        ))}
      </div>

      {activeTab==='overview' && (
        <div className="space-y-4">
          <SectionLabel title="NERRS Weeks Bay — 15-min Water Quality" badge={nerrsOk ? 'LIVE' : nerrsAttempted ? 'CDMO OFFLINE' : 'LOADING'} />
          <div className="tw-card tw-glass-tint-green">
            <div className="flex items-center gap-2 mb-3">
              <div className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0', nerrsOk ? 'bg-emerald-500 animate-pulse' : nerrsAttempted ? 'bg-amber-400' : 'bg-gray-300')}/>
              <div className="font-bold text-sm text-bay-800 flex-1">Weeks Bay NERR — {nerrsOk ? 'Live Readings' : nerrsAttempted ? 'Service Temporarily Unavailable' : 'Connecting...'}</div>
              {nerrsOk && <div className="tw-mono text-[9px] text-bay-300">{nerrs.waterQuality.latestTimestamp}</div>}
            </div>
            {nerrsAttempted && !nerrsOk && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3">
                CDMO API returned an error. NERRS Weeks Bay data will auto-recover when the service is restored. This station monitors DO₂, Temperature, Salinity, Chlorophyll, Turbidity, pH, and Specific Conductance at 15-minute intervals.
              </div>
            )}
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {[
                {l:'DO₂', v:nDO, u:'mg/L', c:doColor(nDO), alert:nDO!=null&&nDO<4},
                {l:'Temp', v:nTemp, u:'°C', c:'#f59e0b'},
                {l:'Salinity', v:nSal, u:'ppt', c:'#7c3aed'},
                {l:'Chlorophyll', v:nChl, u:'µg/L', c:'#16a34a', alert:nChl!=null&&nChl>20},
                {l:'Turbidity', v:nTurb, u:'NTU', c:'#d97706', alert:nTurb!=null&&nTurb>25},
                {l:'pH', v:nPH, u:'', c:'#7c3aed'},
                {l:'SpCond', v:nSpCond, u:'mS/cm', c:'#1d6fcc'},
              ].map(({l,v,u,c,alert:a})=>(
                <div key={l} className={clsx('rounded-lg p-2 text-center backdrop-blur-sm', a?'bg-red-50/70 border border-red-200/60':'bg-white/40')}>
                  <div className="tw-label mb-0.5">{l}</div>
                  <div className="tw-mono text-sm font-bold" style={{color:v!=null?c:'#aed0c2'}}>{v!=null?v.toFixed(2):'—'}{v!=null&&u&&<span className="text-[9px] font-normal text-bay-400 ml-0.5">{u}</span>}</div>
                </div>
              ))}
            </div>
          </div>

          <SectionLabel title="USGS Water Stations" badge={`${usgs.length} stations`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usgs.map(s=>{
              const do2=safeNum(s.readings?.do_mg_l)
              const temp=safeNum(s.readings?.water_temp_c)
              const flow=safeNum(s.readings?.streamflow_cfs)
              const gage=safeNum(s.readings?.gage_height_ft)
              const pH=safeNum(s.readings?.pH)
              const turb=safeNum(s.readings?.turbidity_ntu)
              const cond=safeNum(s.readings?.conductance_us_cm)
              const alert=do2!=null&&do2<4
              const availableParams = [
                do2!=null&&{l:'DO₂',v:do2.toFixed(2),u:'mg/L',c:doColor(do2),alert:do2<4},
                temp!=null&&{l:'Temp',v:temp.toFixed(1),u:'°C',c:'#f59e0b'},
                flow!=null&&{l:'Flow',v:(flow/1000).toFixed(1),u:'K cfs',c:'#3b82f6'},
                gage!=null&&{l:'Stage',v:gage.toFixed(2),u:'ft',c:'#0ea5e9'},
                pH!=null&&{l:'pH',v:pH.toFixed(2),u:'',c:'#7c3aed'},
                turb!=null&&{l:'Turbidity',v:turb.toFixed(1),u:'NTU',c:'#d97706'},
                cond!=null&&{l:'Conductance',v:cond.toFixed(0),u:'µS/cm',c:'#1d6fcc'},
              ].filter(Boolean)
              const hasData = availableParams.length > 0
              return (
                <div key={s.siteNo} className={clsx('tw-card',alert&&'tw-glass-tint-red')}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0',alert?'bg-red-500 animate-pulse':hasData?'bg-emerald-500':'bg-amber-400')}/>
                    <div className="font-bold text-sm text-bay-800 flex-1">{s.name}</div>
                    <div className="tw-mono text-[9px] text-bay-300">{s.siteNo}</div>
                  </div>
                  {hasData ? (
                    <div className={clsx('grid gap-2', availableParams.length===1?'grid-cols-1':availableParams.length===2?'grid-cols-2':'grid-cols-3')}>
                      {availableParams.map(({l,v,u,c,alert:a})=>(
                        <div key={l} className={clsx('rounded-lg p-2 text-center',a?'bg-red-50':'bg-bay-50')}>
                          <div className="tw-label mb-0.5">{l}</div>
                          <div className="tw-mono text-sm font-bold" style={{color:c}}>{v}<span className="text-[9px] font-normal text-bay-400 ml-0.5">{u}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-bay-400 bg-bay-50 rounded-lg p-2 text-center">No current readings available</div>
                  )}
                </div>
              )
            })}
            {usgs.length===0&&<div className="tw-card text-center py-8 text-bay-400 text-sm">Loading station data...</div>}
          </div>

          <SectionLabel title="NOAA CO-OPS Tidal Stations" badge={`${Object.keys(coops).length} stations`} />
          <div className="tw-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(coops).map(s=>{
                const params = [
                  {l:'Water Level',v:safeNum(s.water_level),u:'ft MLLW',c:'#1d6fcc'},
                  {l:'Temp',v:safeNum(s.water_temperature),u:'°F',c:'#f59e0b'},
                  {l:'Salinity',v:safeNum(s.salinity),u:'ppt',c:'#7c3aed'},
                  {l:'Air Temp',v:safeNum(s.air_temperature),u:'°F',c:'#f97316'},
                  {l:'Wind',v:safeNum(s.wind_speed),u:'kts',c:'#3b82f6'},
                  {l:'Pressure',v:safeNum(s.air_pressure),u:'mb',c:'#6366f1'},
                ].filter(p=>p.v!=null)
                return (
                  <div key={s.id} className="p-3 rounded-lg bg-bay-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', params.length > 0 ? 'bg-emerald-500' : 'bg-amber-400')} />
                      <div className="font-semibold text-sm text-bay-800">{s.name}</div>
                    </div>
                    {params.length > 0 ? params.map(({l,v,u,c})=>(
                      <div key={l} className="flex justify-between py-1 border-b border-bay-100 last:border-0">
                        <span className="text-xs text-bay-400">{l}</span>
                        <span className="tw-mono text-sm font-bold" style={{color:c}}>{v.toFixed(2)}<span className="text-[9px] font-normal text-bay-400 ml-1">{u}</span></span>
                      </div>
                    )) : (
                      <div className="text-xs text-bay-400 text-center py-2">Station timeout — retrying</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <SectionLabel title="Ocean Conditions & Currents" badge={hfOk || goesPush?.available ? 'LIVE' : hycomActive || goesImagery ? 'PARTIAL' : 'LOADING'} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="tw-card">
              <div className="tw-label mb-1">GOES-19 SST</div>
              <div className="tw-mono text-2xl font-bold text-blue-600">{goesSst?.toFixed(1) ?? '—'}<span className="text-xs font-normal text-bay-400 ml-1">°C</span></div>
              <div className="text-[10px] text-bay-400 mt-1">{goesSst != null ? (goesSstSource === 'push' ? 'Push pipeline · 5-min' : 'Gulf of Mexico · Hourly') : goesImagery ? 'SST ERDDAP offline · Imagery active' : 'Gulf of Mexico · Hourly'}</div>
              {goesPush?.sst_gradient != null && <div className="text-[9px] text-bay-500 mt-0.5">Gradient: {goesPush.sst_gradient.toFixed(1)}°C</div>}
              {goesImagery && !goesSst && <div className="text-[9px] text-emerald-600 mt-0.5">GEOCOLOR imagery streaming</div>}
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">Current Speed</div>
              <div className="tw-mono text-2xl font-bold text-teal-700">{hfSpeed?.toFixed(2) ?? '—'}<span className="text-xs font-normal text-bay-400 ml-1">m/s</span></div>
              <div className="text-[10px] text-bay-400 mt-1">{hfDir ? `Direction: ${hfDir}` : hfOk ? 'HF Radar' : 'HF Radar ERDDAP offline'}</div>
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">Bloom Transport 14h</div>
              <div className="tw-mono text-2xl font-bold text-amber-600">{hfDist14?.toFixed(0) ?? '—'}<span className="text-xs font-normal text-bay-400 ml-1">km</span></div>
              <div className="text-[10px] text-bay-400 mt-1">24h: {hfDist24?.toFixed(0) ?? '—'} km</div>
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">HYCOM Ocean Model</div>
              <div className="tw-mono text-lg font-bold" style={{color:hycomActive?'#10b981':'#aed0c2'}}>{hycomActive?'Active':'—'}</div>
              <div className="text-[10px] text-bay-400 mt-1">{oceanStatus?.hycom?.product || '1/12° global model'}</div>
            </div>
          </div>
          {(hycomActive || cmemsActive || goesImagery || goesPush?.available) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cmemsActive && <StatBox label="CMEMS Copernicus" value="Active" color="#10b981" sub="Marine service" />}
              {hycomActive && <StatBox label="HYCOM 1/12°" value="Active" color="#10b981" sub="Global ocean model" />}
              {oceanStatus?.streamstats?.available && <StatBox label="USGS StreamStats" value="Active" color="#10b981" sub="Watershed delineation" />}
              {goesImagery && <StatBox label="GOES-19 Imagery" value="Streaming" color="#10b981" sub="GEOCOLOR 5-min refresh" />}
              {goesPush?.qpe_rainfall != null && <StatBox label="GOES QPE Rainfall" value={goesPush.qpe_rainfall.toFixed(1)} unit="mm" color="#3b82f6" sub={`6h: ${goesPush.qpe_6h?.toFixed(1) ?? '—'}mm · 24h: ${goesPush.qpe_24h?.toFixed(1) ?? '—'}mm`} />}
              {goesPush?.cloud_coverage != null && <StatBox label="GOES Cloud Cover" value={goesPush.cloud_coverage.toFixed(0)} unit="%" color="#6366f1" sub="ABI cloud mask" />}
              {goesPush?.glm_flashes != null && <StatBox label="GLM Lightning" value={goesPush.glm_flashes} unit="flashes" color={goesPush.glm_flashes > 5 ? '#dc2626' : '#f59e0b'} sub={goesPush.glm_active ? 'Active storms' : 'Calm'} />}
              {goesPush?.bloom_index != null && <StatBox label="GOES Bloom Index" value={goesPush.bloom_index.toFixed(3)} color={goesPush.bloom_index >= 0.12 ? '#dc2626' : '#10b981'} sub={goesPush.bloom_index >= 0.12 ? 'Elevated chlorophyll' : 'Normal range'} />}
            </div>
          )}
          {goesImagery && goesStatus?.imagery?.imageUrl && (
            <div className="tw-card">
              <div className="flex items-center justify-between mb-2">
                <div className="tw-label">GOES-19 GEOCOLOR — Gulf of Mexico (Live)</div>
                <a href={goesStatus.imagery.animationUrl || goesStatus.imagery.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 hover:underline">Open full size ↗</a>
              </div>
              <img src={goesStatus.imagery.imageUrl} alt="GOES-19 GEOCOLOR Gulf of Mexico" className="w-full rounded-lg border border-bay-100" style={{maxHeight:360,objectFit:'cover'}} />
              <div className="text-[9px] text-bay-400 mt-2">NOAA STAR CDN · GEOCOLOR true-color composite · Auto-refreshes every 5 minutes</div>
            </div>
          )}

          <SectionLabel title="Atmospheric & Weather" badge={omTemp!=null?'LIVE':'LOADING'} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatBox label="Air Temp" value={omTemp?.toFixed(1)} unit="°C" color="#f59e0b" sub="Open-Meteo" />
            <StatBox label="Wind" value={omWind?.toFixed(1)} unit={openMeteo?.current?.wind_ms != null ? "m/s" : "mph"} color="#3b82f6" sub={`Dir: ${safeNum(openMeteo?.current?.wind_dir) ?? '—'}°`} />
            <StatBox label="CAPE" value={omCape?.toFixed(0)} unit="J/kg" color={omCape!=null&&omCape>1000?'#dc2626':'#7c3aed'} sub={omCape!=null&&omCape>1500?'Severe risk':omCape!=null&&omCape>500?'Moderate instability':'Convective potential'} />
            <StatBox label="AQI" value={aqiVal} unit="" color={aqiVal!=null&&aqiVal>100?'#dc2626':'#10b981'} sub={aqiCat || 'AirNow'} />
            <StatBox label="Precip" value={safeNum(openMeteo?.current?.precipitation_mm)?.toFixed(1) ?? safeNum(openMeteo?.current?.rain)?.toFixed(1)} unit="mm" color="#3b82f6" sub="Current hour" />
          </div>
          {purpleAirSensors.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-2">PurpleAir Hyperlocal PM2.5 — {purpleAirSensors.length} Sensors · Avg {purpleAirAvg?.toFixed(1)} µg/m³</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {purpleAirSensors.map((s, i) => (
                  <div key={i} className="rounded-lg p-2 bg-bay-50 text-center">
                    <div className="text-[10px] text-bay-500 truncate">{s.name}</div>
                    <div className="tw-mono text-sm font-bold" style={{color: s.pm25 > 12 ? '#dc2626' : s.pm25 > 6 ? '#f59e0b' : '#10b981'}}>{s.pm25?.toFixed(1)}<span className="text-[9px] font-normal text-bay-400 ml-0.5">µg/m³</span></div>
                    <div className="text-[9px] text-bay-300">{s.humidity}% RH · {s.temp_f}°F</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {forecastData.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-3">7-Day Forecast — Open-Meteo (Mobile Bay)</div>
              <WeatherForecastChart data={forecastData} />
            </div>
          )}

          {aqiChartData.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-3">Air Quality — Multi-Source Comparison</div>
              <AirQualityChart data={aqiChartData} />
            </div>
          )}

          <SectionLabel title="Ecology & Biodiversity" badge={inatCount!=null?'LIVE':'LOADING'} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="tw-card">
              <div className="tw-label mb-1">🦎 iNaturalist</div>
              <div className="tw-mono text-2xl font-bold text-emerald-700">{inatCount?.toLocaleString() ?? '—'}</div>
              <div className="text-[10px] text-bay-400 mt-1">observations ({ecologyStatus?.iNaturalist?.daysBack || 7}d)</div>
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">🌍 GBIF</div>
              <div className="tw-mono text-2xl font-bold text-blue-700">{gbifCount?.toLocaleString() ?? '—'}</div>
              <div className="text-[10px] text-bay-400 mt-1">species occurrences (90d)</div>
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">🐦 eBird</div>
              <div className="tw-mono text-2xl font-bold text-amber-700">{ebirdObs ?? '—'}</div>
              <div className="text-[10px] text-bay-400 mt-1">{ebirdSpecies ?? '—'} species detected</div>
            </div>
            <div className="tw-card">
              <div className="tw-label mb-1">🏗️ AmeriFlux</div>
              <div className="tw-mono text-lg font-bold" style={{color:ecologyStatus?.ameriflux?.configured?'#10b981':'#aed0c2'}}>{ecologyStatus?.ameriflux?.configured?'Active':'—'}</div>
              <div className="text-[10px] text-bay-400 mt-1">{ecologyStatus?.ameriflux?.nearestSite || 'CO₂/CH₄ flux'}</div>
            </div>
          </div>

          <SectionLabel title="Satellite & Remote Sensing" badge={`${satelliteStatus?.totalSources || 0} sources`} />
          {satChartData.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-3">Satellite Granule Availability — Recent</div>
              <SatelliteTimelineChart data={satChartData} />
            </div>
          )}

          <SectionLabel title="Land, Regulatory & Watershed" badge={landStatus ? `${landStatus.totalSources || 0} sources` : 'LOADING'} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(() => {
              const items = [
                landStatus?.openMeteo?.available && {l:'Open-Meteo',v:'Active',c:'#10b981',s:'7-day forecast'},
                landStatus?.fema?.available && {l:'FEMA FIRM',v:landStatus.fema.inFloodZone?'Flood Zone':'No Zone',c:landStatus.fema.inFloodZone?'#dc2626':'#10b981',s:'Flood risk assessment'},
                landStatus?.attains?.available && {l:'EPA ATTAINS',v:'Active',c:'#10b981',s:landStatus?.attains?.data?.items?.[0]?.assessmentUnitCount!=null?`${landStatus.attains.data.items[0].assessmentUnitCount} units`:'Impaired waters'},
                landStatus?.usace?.available && {l:'USACE ORM',v:'Active',c:'#10b981',s:'§404 permits'},
                landStatus?.nwi?.available && {l:'NWI Wetlands',v:'Active',c:'#10b981',s:'USFWS inventory'},
                landStatus?.ssurgo?.available && {l:'SSURGO Soils',v:'Active',c:'#10b981',s:'Hydric soils'},
                landStatus?.nlcd?.available && {l:'NLCD 2021',v:'Active',c:'#10b981',s:'Land cover'},
                landStatus?.ahps?.available && {l:'AHPS Flood',v:'Active',c:'#3b82f6',s:'NOAA flood stage'},
                landStatus?.ncei?.available && {l:'NCEI Climate',v:'Active',c:'#10b981',s:'Climate normals'},
              ].filter(Boolean)
              return items.length > 0 ? items.map(({l,v,c,s})=>(
                <StatBox key={l} label={l} value={v} color={c} sub={s} />
              )) : (
                <div className="col-span-4 tw-card text-center py-4 text-bay-400 text-sm">Loading land & regulatory sources...</div>
              )
            })()}
          </div>
        </div>
      )}

      {activeTab==='time series' && (
        <div className="space-y-4">
          <div className="tw-card">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <div className="tw-label mb-1">Station</div>
                <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)}
                  className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                  {Object.entries(USGS_SITES).map(([id,name])=>(
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="tw-label mb-1">Parameter</div>
                <select value={selectedParam} onChange={e=>setSelectedParam(e.target.value)}
                  className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                  {Object.entries(PARAMS).filter(([k])=>PARAM_CODES[k]).map(([k,m])=>(
                    <option key={k} value={k}>{m.label} ({m.unit||'dim'})</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="tw-label mb-1">Range</div>
                <div className="flex gap-1">
                  {[3,7,14,30].map(d=>(
                    <button key={d} onClick={()=>setHistDays(d)}
                      className={clsx('tw-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors',histDays===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-500 border-bay-200')}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={exportCSV} disabled={!histData.length}
                className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-colors ml-auto">
                ↓ Export CSV
              </button>
            </div>
          </div>

          {histMean!=null && (
            <div className="grid grid-cols-4 gap-2">
              <StatBox label="Mean" value={histMean.toFixed(2)} unit={pmeta?.unit} color={pmeta?.color} />
              <StatBox label="Min" value={histMin?.toFixed(2)} unit={pmeta?.unit} color={doColor(histMin)} />
              <StatBox label="Max" value={histMax?.toFixed(2)} unit={pmeta?.unit} color="#1d6fcc" />
              <StatBox label="Std Dev" value={histStd?.toFixed(2)} unit={pmeta?.unit} color="#7c3aed" sub={`${histVals.length} readings`} />
            </div>
          )}

          <div className="tw-card">
            <div className="flex items-center justify-between mb-3">
              <div className="tw-label">{USGS_SITES[selectedSite] || selectedSite} — {pmeta?.label} — {histDays}d</div>
              {histLoading&&<Spinner size={16}/>}
            </div>
            {histData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={histData.map(d=>({...d,ts:fmtDate(d.timestamp)}))} margin={{top:4,right:8,bottom:0,left:-10}}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={pmeta?.color||'#0a9e80'} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={pmeta?.color||'#0a9e80'} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea"/>
                  <XAxis dataKey="ts" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} interval="preserveStartEnd"/>
                  <YAxis tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  {pmeta?.critLow && <ReferenceLine y={pmeta.critLow} stroke="#dc2626" strokeDasharray="4 2" label={{value:'Critical',fontSize:9,fill:'#dc2626',position:'insideRight'}}/>}
                  {pmeta?.warnLow && <ReferenceLine y={pmeta.warnLow} stroke="#f59e0b" strokeDasharray="4 2" label={{value:'Warning',fontSize:9,fill:'#f59e0b',position:'insideRight'}}/>}
                  {pmeta?.warnHigh && <ReferenceLine y={pmeta.warnHigh} stroke="#f59e0b" strokeDasharray="4 2"/>}
                  {histMean!=null && <ReferenceLine y={histMean} stroke="#4a7060" strokeDasharray="2 4" label={{value:'Mean',fontSize:9,fill:'#4a7060',position:'insideLeft'}}/>}
                  <Area type="monotone" dataKey="value" name={pmeta?.label} stroke={pmeta?.color||'#0a9e80'} fill="url(#histGrad)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-12">
                {histLoading?<Spinner size={28}/>:<div className="text-bay-400 text-sm">No historical data for this selection</div>}
              </div>
            )}
          </div>

          {histData.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-2">Raw Data — Last 20 Readings</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-bay-100">
                    <th className="text-left py-1.5 text-bay-400 font-medium tw-mono">Timestamp</th>
                    <th className="text-right py-1.5 text-bay-400 font-medium tw-mono">{pmeta?.label} ({pmeta?.unit})</th>
                    <th className="text-center py-1.5 text-bay-400 font-medium tw-mono">Status</th>
                  </tr></thead>
                  <tbody>
                    {[...histData].reverse().slice(0,20).map((d,i)=>{
                      const status = selectedParam==='do_mg_l'&&d.value<3?'critical':selectedParam==='do_mg_l'&&d.value<5?'warning':'normal'
                      return (
                        <tr key={i} className="border-b border-bay-50 last:border-0">
                          <td className="py-1.5 text-bay-400 tw-mono">{new Date(d.timestamp).toLocaleString()}</td>
                          <td className="py-1.5 text-right tw-mono font-bold" style={{color:selectedParam==='do_mg_l'?doColor(d.value):'#1a3028'}}>{typeof d.value==='number'?d.value.toFixed(2):d.value}</td>
                          <td className="py-1.5 text-center">
                            <span className={clsx('tw-badge',status==='critical'?'bg-red-50 text-red-700 border border-red-200':status==='warning'?'bg-amber-50 text-amber-700 border border-amber-200':'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==='station compare' && (
        <div className="space-y-4">
          <div className="tw-card">
            <div className="tw-label mb-2">Parameter to Compare</div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PARAMS).map(([k,m])=>(
                <button key={k} onClick={()=>setSelectedParam(k)}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                  style={selectedParam===k?{background:m.color,color:'#fff',borderColor:m.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const allCompare = [...comparisonData]
            if (selectedParam === 'do_mg_l' && nDO != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nDO, siteNo: 'NERRS' })
            if (selectedParam === 'water_temp_c' && nTemp != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nTemp, siteNo: 'NERRS' })
            if (selectedParam === 'water_temp_c' && goesSst != null) allCompare.push({ name: 'GOES-19 SST', value: goesSst, siteNo: 'GOES' })
            if (selectedParam === 'pH' && nPH != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nPH, siteNo: 'NERRS' })
            if (selectedParam === 'turbidity_ntu' && nTurb != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nTurb, siteNo: 'NERRS' })
            if (selectedParam === 'salinity_ppt' && nSal != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nSal, siteNo: 'NERRS' })
            if (selectedParam === 'chlorophyll_ugl' && nChl != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nChl, siteNo: 'NERRS' })
            if (selectedParam === 'conductance_us_cm' && nSpCond != null) allCompare.push({ name: 'NERRS Weeks Bay', value: nSpCond * 1000, siteNo: 'NERRS' })

            return allCompare.length ? (
              <>
                <div className="tw-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="tw-label">{pmeta?.label} — All Sources — Current Reading</div>
                    {pmeta?.critLow&&<div className="text-[10px] text-red-600 tw-mono">Critical: &lt;{pmeta.critLow} {pmeta.unit}</div>}
                    {pmeta?.warnLow&&<div className="text-[10px] text-amber-600 tw-mono">Warn: &lt;{pmeta.warnLow} {pmeta.unit}</div>}
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(180,allCompare.length*48)}>
                    <BarChart data={allCompare} layout="vertical" margin={{top:0,right:40,bottom:0,left:10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" horizontal={false}/>
                      <XAxis type="number" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} unit={pmeta?.unit?` ${pmeta.unit}`:''}/>
                      <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#4a7060'}} width={110}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      {pmeta?.critLow&&<ReferenceLine x={pmeta.critLow} stroke="#dc2626" strokeDasharray="4 2"/>}
                      {pmeta?.warnLow&&<ReferenceLine x={pmeta.warnLow} stroke="#f59e0b" strokeDasharray="4 2"/>}
                      <Bar dataKey="value" name={pmeta?.label} radius={[0,4,4,0]}>
                        {allCompare.map((d,i)=>(
                          <Cell key={i} fill={selectedParam==='do_mg_l'?doColor(d.value):d.siteNo==='NERRS'?'#16a34a':d.siteNo==='GOES'?'#1d6fcc':pmeta?.color||'#0a9e80'}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="tw-card">
                  <div className="tw-label mb-2">Ranked — {pmeta?.label}</div>
                  {[...allCompare].sort((a,b)=>a.value-b.value).map((d,i)=>{
                    const pct=(d.value/(Math.max(...allCompare.map(x=>x.value))||1))*100
                    const color=selectedParam==='do_mg_l'?doColor(d.value):d.siteNo==='NERRS'?'#16a34a':pmeta?.color||'#0a9e80'
                    return (
                      <div key={d.siteNo+d.name} className="py-2 border-b border-bay-50 last:border-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="tw-mono text-[10px] text-bay-300 w-4">#{i+1}</span>
                          <span className="text-sm text-bay-700 flex-1">{d.name}</span>
                          <span className="tw-mono text-sm font-bold" style={{color}}>{d.value.toFixed(2)} {pmeta?.unit}</span>
                        </div>
                        <div className="ml-7 h-2 rounded-full bg-bay-50 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:color}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="tw-card text-center py-8 text-bay-400 text-sm">
                {loading.water?<Spinner size={28}/>:'No data for this parameter across sources'}
              </div>
            )
          })()}
        </div>
      )}

      {activeTab==='correlation' && (
        <div className="space-y-4">
          <div className="tw-card bg-bay-50 border-bay-200">
            <div className="tw-label mb-1">Temperature vs DO₂ — Multi-Source Snapshot</div>
            <div className="text-xs text-bay-400">Each point is one monitoring source (USGS + NERRS + GOES). Shows the inverse relationship: warmer water holds less dissolved oxygen.</div>
          </div>
          {(() => {
            const scatter = usgs.filter(s=>safeNum(s.readings?.water_temp_c)!=null&&safeNum(s.readings?.do_mg_l)!=null)
              .map(s=>({ x:safeNum(s.readings.water_temp_c), y:safeNum(s.readings.do_mg_l), name:s.name.split(' at ')[0].split(' near ')[0], source:'USGS' }))
            if (nTemp != null && nDO != null) scatter.push({ x: nTemp, y: nDO, name: 'Weeks Bay NERRS', source: 'NERRS' })
            if (goesSst != null && nDO != null) scatter.push({ x: goesSst, y: nDO, name: 'GOES SST vs NERRS DO₂', source: 'GOES+NERRS' })

            return scatter.length >= 2 ? (
              <div className="tw-card">
                <div className="tw-label mb-3">Temperature (°C) vs DO₂ (mg/L) — {scatter.length} points</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{top:4,right:8,bottom:20,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea"/>
                    <XAxis type="number" dataKey="x" name="Temp" unit="°C" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} label={{value:'Temperature (°C)',position:'insideBottom',offset:-10,fontSize:10,fill:'#4a7060'}}/>
                    <YAxis type="number" dataKey="y" name="DO₂" unit=" mg/L" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}}/>
                    <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{value:'Stress threshold',fontSize:9,fill:'#f59e0b',position:'right'}}/>
                    <ReferenceLine y={3} stroke="#dc2626" strokeDasharray="4 2" label={{value:'Critical',fontSize:9,fill:'#dc2626',position:'right'}}/>
                    <Tooltip content={({active,payload})=>{ if(!active||!payload?.length) return null; const d=payload[0]?.payload; return <div className="tw-card shadow-md py-2 px-3 text-xs"><div className="font-bold text-bay-800 mb-1">{d.name}</div><div className="tw-mono text-[9px] text-bay-400 mb-1">{d.source}</div><div className="tw-mono text-bay-600">Temp: {d.x?.toFixed(1)}°C</div><div className="tw-mono" style={{color:doColor(d.y)}}>DO₂: {d.y?.toFixed(2)} mg/L</div></div>}}/>
                    <Scatter data={scatter} fill="#0a9e80">
                      {scatter.map((d,i)=><Cell key={i} fill={d.source==='NERRS'?'#16a34a':d.source==='GOES+NERRS'?'#1d6fcc':doColor(d.y)}/>)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-bay-50">
                  {[
                    {l:'USGS Station',c:'#0a9e80',desc:'Riverine monitoring'},
                    {l:'NERRS Weeks Bay',c:'#16a34a',desc:'Estuarine 15-min'},
                    {l:'GOES SST cross',c:'#1d6fcc',desc:'Satellite vs in-situ'},
                    {l:'Hypoxia Zone',c:'#dc2626',desc:'DO₂ < 3 mg/L'},
                  ].map(z=>(
                    <div key={z.l} className="p-2 rounded bg-bay-50 text-center">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{background:z.c}}/>
                      <div className="text-[10px] font-semibold" style={{color:z.c}}>{z.l}</div>
                      <div className="text-[9px] text-bay-400 leading-tight mt-0.5">{z.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tw-card text-center py-8 text-bay-400 text-sm">Need ≥2 sources with both temperature and DO₂ readings</div>
            )
          })()}

          {nerrsOk && nSal != null && nDO != null && (
            <div className="tw-card">
              <div className="tw-label mb-3">Salinity vs DO₂ — NERRS + CO-OPS</div>
              {(() => {
                const pts = [{ x: nSal, y: nDO, name: 'NERRS Weeks Bay' }]
                Object.values(coops).forEach(s => {
                  const sal = safeNum(s.salinity)
                  if (sal != null && nDO != null) pts.push({ x: sal, y: nDO, name: s.name })
                })
                return pts.length >= 1 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ScatterChart margin={{top:4,right:8,bottom:20,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea"/>
                      <XAxis type="number" dataKey="x" name="Salinity" unit=" ppt" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} label={{value:'Salinity (ppt)',position:'insideBottom',offset:-10,fontSize:10,fill:'#4a7060'}}/>
                      <YAxis type="number" dataKey="y" name="DO₂" unit=" mg/L" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}}/>
                      <Tooltip content={({active,payload})=>{ if(!active||!payload?.length) return null; const d=payload[0]?.payload; return <div className="tw-card shadow-md py-2 px-3 text-xs"><div className="font-bold text-bay-800 mb-1">{d.name}</div><div className="tw-mono text-bay-600">Sal: {d.x?.toFixed(1)} ppt</div><div className="tw-mono" style={{color:doColor(d.y)}}>DO₂: {d.y?.toFixed(2)} mg/L</div></div>}}/>
                      <Scatter data={pts} fill="#7c3aed">
                        {pts.map((d,i)=><Cell key={i} fill={i===0?'#16a34a':'#7c3aed'}/>)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : null
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab==='export' && (
        <div className="space-y-3">
          <div className="tw-card">
            <div className="tw-label mb-2">Full Multi-Source Snapshot Export</div>
            <div className="text-sm text-bay-600 mb-3">Current readings from all sources — USGS, NERRS, CO-OPS, GOES-19, AirNow, HF Radar, Open-Meteo, iNaturalist, GBIF — formatted for spreadsheet analysis.</div>
            <button onClick={exportAllCSV} className="tw-btn-primary">
              ↓ Download All Sources CSV
            </button>
          </div>
          <div className="tw-card">
            <div className="tw-label mb-2">Historical Time Series Export</div>
            <div className="text-sm text-bay-600 mb-3">Select a station and parameter in the Time Series tab, then export up to 30 days of hourly readings.</div>
            <div className="flex gap-3 items-center flex-wrap">
              <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)} className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                {Object.entries(USGS_SITES).map(([id,name])=><option key={id} value={id}>{name}</option>)}
              </select>
              <select value={selectedParam} onChange={e=>setSelectedParam(e.target.value)} className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                {Object.entries(PARAMS).filter(([k])=>PARAM_CODES[k]).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}
              </select>
              {[3,7,14,30].map(d=>(
                <button key={d} onClick={()=>setHistDays(d)} className={clsx('tw-mono text-[10px] px-2.5 py-1 rounded-lg border',histDays===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-500 border-bay-200')}>
                  {d}d
                </button>
              ))}
              <button onClick={()=>{loadHistorical().then(exportCSV)}} disabled={histLoading} className="tw-btn-primary disabled:opacity-50">
                {histLoading?<Spinner size={14}/>:'↓'} Export Time Series CSV
              </button>
            </div>
            {histData.length>0&&<div className="text-xs text-bay-400 mt-2 tw-mono">{histData.length} readings ready · {pmeta?.label} · {USGS_SITES[selectedSite]}</div>}
          </div>
          <div className="tw-card bg-bay-50">
            <div className="tw-label mb-2">API Direct Access</div>
            <div className="text-sm text-bay-600 mb-2">All TERRAWATCH data is accessible via REST API for direct integration into R, Python, or MATLAB workflows.</div>
            <div className="space-y-1.5">
              {[
                {label:'All stations realtime',url:'GET /api/water/realtime'},
                {label:'HAB Oracle assessment',url:'GET /api/hab/assess'},
                {label:'Historical data',url:'GET /api/water/historical/{siteNo}/{paramCode}?days=7'},
                {label:'NERRS Weeks Bay',url:'GET /api/sensors/nerrs/latest'},
                {label:'HF Radar currents',url:'GET /api/sensors/hfradar/summary'},
                {label:'GOES-19 status',url:'GET /api/sensors/goes/status'},
                {label:'Satellite composite',url:'GET /api/sensors/satellite/status'},
                {label:'Ocean composite',url:'GET /api/sensors/ocean/status'},
                {label:'Ecology composite',url:'GET /api/sensors/ecology/status'},
                {label:'Air quality composite',url:'GET /api/sensors/airplus/status'},
                {label:'Land/regulatory composite',url:'GET /api/sensors/land/status'},
                {label:'Sensor registry',url:'GET /api/sensors/registry'},
                {label:'ML Architecture v2 spec',url:'GET /api/ml/spec'},
              ].map(({label,url})=>(
                <div key={url} className="flex items-center gap-3 py-1.5 border-b border-bay-100 last:border-0">
                  <span className="text-xs text-bay-500 flex-1">{label}</span>
                  <code className="tw-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{url}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

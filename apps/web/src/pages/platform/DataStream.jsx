import { useState, useEffect } from 'react'
import { useStore } from '../../store/index.js'
import clsx from 'clsx'

function safeVal(v) {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'object' && 'value' in v) return safeVal(v.value)
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

const TABS = [
  { id: 'water', label: 'Water Quality', icon: '💧', color: '#0ea5e9' },
  { id: 'goes', label: 'GOES-19', icon: '🛰️', color: '#d97706' },
  { id: 'atmos', label: 'Atmospheric', icon: '🌤️', color: '#10b981' },
  { id: 'model', label: 'ML Model', icon: '🧠', color: '#7c3aed' },
  { id: 'sat', label: 'Satellite', icon: '📡', color: '#6366f1' },
  { id: 'eco', label: 'Ecology', icon: '🌿', color: '#16a34a' },
  { id: 'air', label: 'Air Quality', icon: '🌬️', color: '#f59e0b' },
  { id: 'land', label: 'Land/Weather', icon: '🏔️', color: '#8b5cf6' },
  { id: 'ml', label: 'Feature Vector', icon: '⊡', color: '#ec4899' },
]

function degToCompass(deg) {
  if (deg == null) return null
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function alertBadge(label, value) {
  const v = safeVal(value)
  if (v == null) return null
  const lbl = label.toLowerCase()
  if (lbl.includes('do') && !lbl.includes('dom') && v < 4) return 'CRITICAL'
  if (lbl.includes('uv') && v > 8) return 'VERY HIGH'
  if (lbl.includes('pm2.5') && v > 35) return 'UNHEALTHY'
  if (lbl.includes('wave') && lbl.includes('height') && v > 2) return 'HIGH SEAS'
  if (lbl.includes('gust') && v > 15) return 'GUSTY'
  return null
}

function KeyRow({ label, value, unit, source }) {
  const raw = typeof value === 'object' && value != null && 'value' in value ? value.value : value
  const num = safeVal(raw)
  const display = num != null
    ? (typeof num === 'number' ? num.toFixed(2) : String(num))
    : (raw != null && raw !== '' ? String(raw) : '—')
  const isDir = unit === '°' && (label.toLowerCase().includes('dir') || label.toLowerCase().includes('direction'))
  const compass = isDir && num != null ? degToCompass(num) : null
  const badge = alertBadge(label, raw)
  return (
    <div className="flex items-center py-1.5 border-b border-bay-50 last:border-0">
      <div className="flex-1 text-xs text-bay-600">{label}</div>
      {badge && <span className="tw-mono text-[8px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-bold mr-1">{badge}</span>}
      <div className="tw-mono text-xs font-semibold text-bay-800 mr-2">
        {display}
        {compass && <span className="text-teal-600 font-normal ml-1">{compass}</span>}
        {unit && display !== '—' && !compass && <span className="text-bay-400 font-normal ml-1">{unit}</span>}
      </div>
      {source && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-bay-50 text-bay-300">{source}</span>}
    </div>
  )
}

function DataCard({ title, children, color }) {
  return (
    <div className="tw-card mb-3" style={{ borderLeft: `3px solid ${color || '#0a9e80'}` }}>
      <div className="tw-label mb-2" style={{ color }}>{title}</div>
      {children}
    </div>
  )
}

export default function DataStream() {
  const {
    waterQuality, weather, nerrs, hfradar, goesStatus, goesLatest,
    ecologyStatus, landStatus, airplusStatus, sensors, habAssessment,
    satelliteStatus, oceanStatus,
    fetchNERRS, fetchHFRadar, fetchAQI, fetchGOESStatus, fetchGoesLatest,
    fetchEcologyStatus, fetchLandStatus, fetchAirPlusStatus,
    fetchSatelliteStatus, fetchOceanStatus,
  } = useStore()

  const [tab, setTab] = useState('water')
  const [featureVector, setFeatureVector] = useState(null)
  const [fvLoading, setFvLoading] = useState(false)

  useEffect(() => {
    fetchNERRS(); fetchHFRadar(); fetchGOESStatus(); fetchGoesLatest()
    fetchEcologyStatus(); fetchLandStatus(); fetchAirPlusStatus()
    fetchSatelliteStatus(); fetchOceanStatus()
  }, [])

  useEffect(() => {
    if (tab === 'ml' && !featureVector) {
      setFvLoading(true)
      fetch('/api/intelligence/live-vector')
        .then(r => r.json())
        .then(d => { setFeatureVector(d.vector || d); setFvLoading(false) })
        .catch(() => setFvLoading(false))
    }
  }, [tab, featureVector])

  const usgs = waterQuality?.usgs || []
  const coops = waterQuality?.coops || {}
  const buoy = waterQuality?.buoy
  const wb = nerrs?.waterQuality?.latest || {}
  const met = nerrs?.meteorological?.latest || {}
  const omCur = landStatus?.openMeteo?.current || {}
  const omDaily = landStatus?.openMeteo?.dailyForecast || []
  const goes = goesLatest || {}
  const push = goesStatus?.push || {}

  const renderTab = () => {
    switch (tab) {
      case 'water':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usgs.map(s => (
              <DataCard key={s.siteNo} title={`USGS ${s.siteNo} — ${s.name}`} color="#0ea5e9">
                <KeyRow label="DO₂" value={s.readings?.do_mg_l} unit="mg/L" source="USGS NWIS" />
                <KeyRow label="Water Temp" value={s.readings?.water_temp_c} unit="°C" source="USGS NWIS" />
                <KeyRow label="Streamflow" value={s.readings?.streamflow_cfs} unit="cfs" source="USGS NWIS" />
                <KeyRow label="pH" value={s.readings?.pH} source="USGS NWIS" />
                <KeyRow label="Turbidity" value={s.readings?.turbidity_ntu} unit="NTU" source="USGS NWIS" />
                <KeyRow label="Conductance" value={s.readings?.conductance_us_cm} unit="µS/cm" source="USGS NWIS" />
                <KeyRow label="Gage Height" value={s.readings?.gage_height_ft} unit="ft" source="USGS NWIS" />
                <KeyRow label="Ortho-Phosphate" value={s.readings?.orthophosphate_mg_l} unit="mg/L" source="USGS NWIS" />
                <KeyRow label="Total Nitrogen" value={s.readings?.total_nitrogen_mg_l} unit="mg/L" source="USGS NWIS" />
              </DataCard>
            ))}
            {Object.entries(coops).map(([id, s]) => (
              <DataCard key={id} title={`CO-OPS ${id} — ${s.name}`} color="#3b82f6">
                <KeyRow label="Water Level" value={s.water_level} unit="ft" source="CO-OPS" />
                <KeyRow label="Salinity" value={s.salinity} unit="ppt" source="CO-OPS" />
                <KeyRow label="Water Temp" value={s.water_temperature} unit="°C" source="CO-OPS" />
                <KeyRow label="Wind Speed" value={s.wind} unit="m/s" source="CO-OPS" />
                <KeyRow label="Air Pressure" value={s.air_pressure} unit="mb" source="CO-OPS" />
                <KeyRow label="Air Temp" value={s.air_temperature} unit="°C" source="CO-OPS" />
              </DataCard>
            ))}
            <DataCard title="NDBC Buoy 42012 — Offshore Gulf" color="#f59e0b">
              <KeyRow label="Water Temp" value={buoy?.WTMP} unit="°C" source="NDBC" />
              <KeyRow label="Wind Speed" value={buoy?.WSPD} unit="m/s" source="NDBC" />
              <KeyRow label="Wind Gust" value={buoy?.GST} unit="m/s" source="NDBC" />
              <KeyRow label="Wind Dir" value={buoy?.WDIR} unit="°" source="NDBC" />
              <KeyRow label="Wave Height" value={buoy?.WVHT} unit="m" source="NDBC" />
              <KeyRow label="Dom Wave Period" value={buoy?.DPD} unit="s" source="NDBC" />
              <KeyRow label="Mean Wave Dir" value={buoy?.MWD} unit="°" source="NDBC" />
              <KeyRow label="Air Temp" value={buoy?.ATMP} unit="°C" source="NDBC" />
              <KeyRow label="Pressure" value={buoy?.PRES} unit="mb" source="NDBC" />
              <KeyRow label="Dewpoint" value={buoy?.DEWP} unit="°C" source="NDBC" />
            </DataCard>
            <DataCard title="NERRS Weeks Bay — Water Quality" color="#7c3aed">
              <KeyRow label="DO₂" value={wb.DO_mgl?.value} unit="mg/L" source="NERRS" />
              <KeyRow label="DO%" value={wb.DO_pct?.value} unit="%" source="NERRS" />
              <KeyRow label="Temperature" value={wb.Temp?.value} unit="°C" source="NERRS" />
              <KeyRow label="Salinity" value={wb.Sal?.value} unit="ppt" source="NERRS" />
              <KeyRow label="Turbidity" value={wb.Turb?.value} unit="NTU" source="NERRS" />
              <KeyRow label="Chl Fluorescence" value={wb.ChlFluor?.value} unit="µg/L" source="NERRS" />
              <KeyRow label="Sp. Conductance" value={wb.SpCond?.value} unit="mS/cm" source="NERRS" />
              <KeyRow label="pH" value={wb.pH?.value} source="NERRS" />
              <KeyRow label="Depth" value={wb.Depth?.value ?? wb.Level?.value} unit="m" source="NERRS" />
            </DataCard>
            <DataCard title="NERRS Weeks Bay — Meteorological" color="#7c3aed">
              <KeyRow label="Wind Speed" value={met.WSpd?.value} unit="m/s" source="NERRS Met" />
              <KeyRow label="Max Wind Speed" value={met.MaxWSpd?.value} unit="m/s" source="NERRS Met" />
              <KeyRow label="Wind Direction" value={met.Wdir?.value} unit="°" source="NERRS Met" />
              <KeyRow label="Air Temp" value={met.ATemp?.value} unit="°C" source="NERRS Met" />
              <KeyRow label="Barometric Pressure" value={met.BP?.value} unit="mb" source="NERRS Met" />
              <KeyRow label="PAR" value={met.TotPAR?.value} unit="mmol/m²" source="NERRS Met" />
              <KeyRow label="Precip" value={met.TotPrec?.value} unit="mm" source="NERRS Met" />
              <KeyRow label="Relative Humidity" value={met.RH?.value} unit="%" source="NERRS Met" />
            </DataCard>
            {hfradar?.available && (
              <DataCard title="HF Radar — Surface Currents" color="#0ea5e9">
                <KeyRow label="Avg Speed" value={hfradar.avgSpeed_ms} unit="m/s" source="HF Radar" />
                <KeyRow label="Direction" value={hfradar.avgDirection_deg} unit="°" source="HF Radar" />
                <KeyRow label="Cardinal" value={hfradar.directionCardinal} source="HF Radar" />
                <KeyRow label="Bloom Transport 14h" value={hfradar.bloom_transport?.distance_14h_km} unit="km" source="HF Radar" />
              </DataCard>
            )}
          </div>
        )

      case 'goes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="GOES-19 Push Pipeline — Latest" color="#d97706">
              <KeyRow label="SST Mean" value={goes.sst_mean ?? push.sst_mean} unit="°C" source="GOES-19" />
              <KeyRow label="SST Gradient" value={goes.sst_gradient ?? push.sst_gradient} unit="°C/km" source="GOES-19" />
              <KeyRow label="QPE Rainfall" value={goes.qpe_rainfall ?? push.qpe_rainfall} unit="mm" source="GOES-19" />
              <KeyRow label="QPE 6h" value={goes.qpe_6h ?? push.qpe_6h} unit="mm" source="GOES-19" />
              <KeyRow label="QPE 24h" value={goes.qpe_24h ?? push.qpe_24h} unit="mm" source="GOES-19" />
              <KeyRow label="Cloud Coverage" value={goes.cloud_coverage ?? push.cloud_coverage} unit="%" source="GOES-19" />
              <KeyRow label="GLM Flashes" value={goes.glm_flashes ?? push.glm_flashes} source="GOES-19 GLM" />
              <KeyRow label="GLM Active" value={goes.glm_active} source="GOES-19 GLM" />
              <KeyRow label="AMV Wind Speed" value={goes.amv_wind_speed ?? push.amv_wind_speed} unit="m/s" source="GOES-19" />
              <KeyRow label="AMV Wind Dir" value={goes.amv_wind_dir ?? push.amv_wind_dir} unit="°" source="GOES-19" />
              <KeyRow label="Bloom Index" value={goes.bloom_index ?? push.bloom_index} source="GOES-19" />
              <KeyRow label="Turbidity Index" value={goes.turbidity_idx ?? push.turbidity_idx} source="GOES-19" />
            </DataCard>
            <DataCard title="GOES-19 Status" color="#d97706">
              <KeyRow label="Push Available" value={push.available ? 'YES' : 'NO'} source="Push" />
              <KeyRow label="Last Scan" value={goesStatus?.status?.lastScan || '—'} source="System" />
              <KeyRow label="ERDDAP Available" value={goesStatus?.status?.available ? 'YES' : 'NO'} source="ERDDAP" />
              <KeyRow label="Imagery Available" value={goesStatus?.status?.imageryAvailable ? 'YES' : 'NO'} source="GIBS" />
            </DataCard>
          </div>
        )

      case 'atmos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="NWS Weather — Mobile Bay" color="#10b981">
              <KeyRow label="Temperature" value={weather?.current?.temp_f} unit="°F" source="NWS" />
              <KeyRow label="Temp (C)" value={weather?.current?.temp_c} unit="°C" source="NWS" />
              <KeyRow label="Wind Speed" value={weather?.current?.wind_speed_mph} unit="mph" source="NWS" />
              <KeyRow label="Wind Speed (m/s)" value={weather?.current?.wind_speed_ms} unit="m/s" source="NWS" />
              <KeyRow label="Wind Gust" value={weather?.current?.wind_gust_mph} unit="mph" source="NWS" />
              <KeyRow label="Wind Gust (m/s)" value={weather?.current?.wind_gust_ms} unit="m/s" source="NWS" />
              <KeyRow label="Wind Direction" value={weather?.current?.wind_direction} unit="°" source="NWS" />
              <KeyRow label="Humidity" value={weather?.current?.humidity} unit="%" source="NWS" />
              <KeyRow label="Dewpoint" value={weather?.current?.dewpoint_c} unit="°C" source="NWS" />
              <KeyRow label="Pressure" value={weather?.current?.pressure_mb} unit="mb" source="NWS" />
              <KeyRow label="Visibility" value={weather?.current?.visibility_m} unit="m" source="NWS" />
            </DataCard>
            <DataCard title="Open-Meteo — Current" color="#10b981">
              <KeyRow label="Temperature" value={omCur.temp_c} unit="°C" source="Open-Meteo" />
              <KeyRow label="Wind" value={omCur.wind_ms} unit="m/s" source="Open-Meteo" />
              <KeyRow label="Precip" value={omCur.precip_mm} unit="mm" source="Open-Meteo" />
              <KeyRow label="CAPE" value={omCur.cape} unit="J/kg" source="Open-Meteo" />
              <KeyRow label="Solar Radiation" value={omCur.solar_rad_wm2} unit="W/m²" source="Open-Meteo" />
              <KeyRow label="UV Index" value={omCur.uv_index} source="Open-Meteo" />
              <KeyRow label="Lifted Index" value={omCur.lifted_index} source="Open-Meteo" />
              <KeyRow label="Soil Moisture" value={omCur.soil_moisture} unit="m³/m³" source="Open-Meteo" />
              <KeyRow label="CIN" value={omCur.cin} unit="J/kg" source="Open-Meteo" />
              <KeyRow label="Boundary Layer Height" value={omCur.blh} unit="m" source="Open-Meteo" />
            </DataCard>
          </div>
        )

      case 'model':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="HAB Oracle — Assessment" color="#7c3aed">
              <KeyRow label="Probability" value={habAssessment?.hab?.probability} unit="%" source="HAB Oracle" />
              <KeyRow label="Risk Level" value={habAssessment?.hab?.riskLevel} source="HAB Oracle" />
              <KeyRow label="Seasonal Prior" value={habAssessment?.hab?.seasonalPrior} unit="%" source="HAB Oracle" />
              <KeyRow label="Confidence" value={habAssessment?.hab?.dataQuality?.confidence} source="HAB Oracle" />
              <KeyRow label="Input Count" value={habAssessment?.hab?.dataQuality?.inputCount} source="HAB Oracle" />
              <KeyRow label="+24h Outlook" value={habAssessment?.hab?.outlook?.h24} unit="%" source="HAB Oracle" />
              <KeyRow label="+48h Outlook" value={habAssessment?.hab?.outlook?.h48} unit="%" source="HAB Oracle" />
              <KeyRow label="+72h Outlook" value={habAssessment?.hab?.outlook?.h72} unit="%" source="HAB Oracle" />
            </DataCard>
            <DataCard title="Hypoxia Forecast" color="#7c3aed">
              <KeyRow label="Probability" value={habAssessment?.hypoxia?.probability} unit="%" source="Hypoxia Model" />
              <KeyRow label="Risk Level" value={habAssessment?.hypoxia?.riskLevel} source="Hypoxia Model" />
              <KeyRow label="Jubilee Risk" value={habAssessment?.hypoxia?.jubileeRisk ? 'ELEVATED' : 'LOW'} source="Hypoxia Model" />
            </DataCard>
          </div>
        )

      case 'sat':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="Satellite Status" color="#6366f1">
              <KeyRow label="MODIS Terra Granules" value={satelliteStatus?.modis?.terra?.recentGranules} source="NASA CMR" />
              <KeyRow label="MODIS Aqua Granules" value={satelliteStatus?.modis?.aqua?.recentGranules} source="NASA CMR" />
              <KeyRow label="Sentinel-3A" value={satelliteStatus?.sentinel3?.a?.recentGranules} source="ESA" />
              <KeyRow label="Sentinel-3B" value={satelliteStatus?.sentinel3?.b?.recentGranules} source="ESA" />
              <KeyRow label="Landsat 8/9" value={satelliteStatus?.landsat?.recentGranules} source="USGS" />
              <KeyRow label="PACE OCI" value={satelliteStatus?.pace?.recentGranules} source="NASA" />
            </DataCard>
            <DataCard title="Ocean Models" color="#6366f1">
              <KeyRow label="HYCOM Available" value={oceanStatus?.hycom?.available ? 'YES' : 'NO'} source="HYCOM" />
              <KeyRow label="HYCOM SST" value={oceanStatus?.hycom?.sst} unit="°C" source="HYCOM" />
              <KeyRow label="HYCOM Salinity" value={oceanStatus?.hycom?.salinity} unit="psu" source="HYCOM" />
              <KeyRow label="CBOFS Available" value={oceanStatus?.cbofs?.available ? 'YES' : 'NO'} source="CBOFS" />
            </DataCard>
          </div>
        )

      case 'eco':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="Ecology — Biodiversity" color="#16a34a">
              <KeyRow label="iNaturalist Obs (7d)" value={ecologyStatus?.iNaturalist?.totalCount} source="iNaturalist" />
              <KeyRow label="eBird Obs (7d)" value={ecologyStatus?.eBird?.totalAlabamaObs ?? ecologyStatus?.eBird?.mobileBayObs} source="eBird" />
              <KeyRow label="AmeriFlux Active" value={ecologyStatus?.ameriflux?.available ? 'YES' : 'NO'} source="AmeriFlux" />
            </DataCard>
          </div>
        )

      case 'air':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="Air Quality" color="#f59e0b">
              <KeyRow label="OpenAQ PM2.5" value={airplusStatus?.openAQ?.avgPM25} unit="µg/m³" source="OpenAQ" />
              <KeyRow label="PurpleAir PM2.5" value={airplusStatus?.purpleAir?.avgPM25} unit="µg/m³" source="PurpleAir" />
              <KeyRow label="PurpleAir Sensors" value={airplusStatus?.purpleAir?.sensorCount} source="PurpleAir" />
              <KeyRow label="TROPOMI NO₂" value={airplusStatus?.tropomi?.no2Available ? 'Available' : 'N/A'} source="ESA" />
            </DataCard>
          </div>
        )

      case 'land':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DataCard title="Open-Meteo 7-Day Forecast" color="#8b5cf6">
              {omDaily.map((d, i) => (
                <div key={i} className="flex items-center py-1 border-b border-bay-50 last:border-0 gap-2">
                  <span className="tw-mono text-[10px] text-bay-400 w-20">{d.date}</span>
                  <span className="tw-mono text-xs">{d.high_c != null ? `${d.high_c.toFixed(0)}°` : '—'}/{d.low_c != null ? `${d.low_c.toFixed(0)}°` : '—'}</span>
                  <span className="tw-mono text-[10px] text-bay-400">{d.precipProb ?? '—'}%</span>
                  {d.uv_max != null && <span className="tw-mono text-[10px] text-amber-600">UV {d.uv_max.toFixed(1)}</span>}
                  {d.sunshine_hrs != null && <span className="tw-mono text-[10px] text-yellow-600">{d.sunshine_hrs.toFixed(1)}h sun</span>}
                </div>
              ))}
            </DataCard>
            <DataCard title="Land/Regulatory" color="#8b5cf6">
              <KeyRow label="AHPS Flood Stage" value={landStatus?.ahps?.stage} unit="ft" source="AHPS" />
              <KeyRow label="AHPS Active" value={landStatus?.ahps?.available ? 'YES' : 'NO'} source="AHPS" />
              <KeyRow label="FEMA Flood Zone" value={landStatus?.fema?.floodZone ? 'YES' : 'NO'} source="FEMA" />
              <KeyRow label="NLCD Impervious" value={landStatus?.nlcd?.imperviousPct} unit="%" source="NLCD" />
              <KeyRow label="NCEI Available" value={landStatus?.ncei?.available ? 'YES' : 'NO'} source="NCEI" />
            </DataCard>
          </div>
        )

      case 'ml':
        return (
          <div>
            {fvLoading ? (
              <div className="text-center py-8 text-bay-400">Loading 141-key feature vector...</div>
            ) : featureVector ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(featureVector).map(([key, val]) => (
                  <div key={key} className="flex items-center py-1 border-b border-bay-50">
                    <span className="tw-mono text-[10px] text-bay-500 flex-1 truncate">{key}</span>
                    <span className="tw-mono text-xs font-semibold text-bay-800">
                      {val != null ? (typeof val === 'number' ? val.toFixed(4) : String(val)) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-bay-400">Click the Feature Vector tab to load</div>
            )}
            {featureVector && (
              <div className="mt-4 tw-mono text-[9px] text-bay-300">
                Total keys: {Object.keys(featureVector).length} | Non-null: {Object.values(featureVector).filter(v => v != null).length}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-7xl animate-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⊡</span>
            <h1 className="text-lg font-bold text-bay-800" style={{ fontFamily: 'Syne, sans-serif' }}>
              DataStream Explorer
            </h1>
            <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 font-bold">
              141 KEYS
            </span>
          </div>
          <p className="text-xs text-bay-400 mt-0.5">Full 141-key feature vector explorer — every data source in one view</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
              tab === t.id
                ? 'shadow-sm'
                : 'bg-white text-bay-500 border-bay-100 hover:border-bay-200'
            )}
            style={tab === t.id ? { background: t.color + '15', color: t.color, borderColor: t.color + '40' } : undefined}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  )
}

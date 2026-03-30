import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, Section } from '../components/Common/index.jsx'
import clsx from 'clsx'

function safeNum(v) { if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; if(typeof v==='object'&&'value'in v)return safeNum(v.value); const n=parseFloat(v); return isNaN(n)?null:n }

const STATUS = {
  live:     { dot:'bg-emerald-500', label:'LIVE',        cls:'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial:  { dot:'bg-amber-400',   label:'PARTIAL',     cls:'bg-amber-50 text-amber-700 border-amber-200' },
  keyed:    { dot:'bg-blue-400',    label:'KEY NEEDED',  cls:'bg-blue-50 text-blue-700 border-blue-200' },
  offline:  { dot:'bg-red-400',     label:'OFFLINE',     cls:'bg-red-50 text-red-700 border-red-200' },
  planned:  { dot:'bg-gray-300',    label:'PLANNED',     cls:'bg-gray-50 text-gray-500 border-gray-200' },
}

function FeedCard({ name, icon, status, value, unit, sub, url, note, worldFirst, badge }) {
  const s = STATUS[status] || STATUS.planned
  return (
    <div className={clsx('tw-card hover:shadow-md transition-shadow', status==='offline'&&'border-red-200 bg-red-50')}>
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
      {url && <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-teal-600 hover:underline mt-1 block">{url}</a>}
    </div>
  )
}

function SectionHeader({ title, count, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="tw-mono text-[9px] font-bold tracking-[0.15em] text-bay-400 uppercase">{title}</div>
      {count != null && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold" style={{background:`${color}15`,color,border:`1px solid ${color}33`}}>{count} feeds</span>}
    </div>
  )
}

export default function FeedStatus() {
  const {
    waterQuality, habAssessment, weather, nerrs, hfradar, aqi,
    paceStatus, methane, openeo, sensors, feedStatus, epaNpdes,
    loading, fetchAll, fetchNERRS, fetchHFRadar, fetchPACEStatus,
    fetchMethane, fetchOpenEO, fetchEPANPDES, fetchAQI
  } = useStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchNERRS(); fetchHFRadar(); fetchPACEStatus(); fetchMethane(); fetchOpenEO(); fetchEPANPDES(); fetchAQI()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    await Promise.all([fetchPACEStatus(), fetchMethane(), fetchOpenEO(), fetchEPANPDES()])
    setRefreshing(false)
  }

  const usgsCount = waterQuality?.usgs?.filter(s=>Object.keys(s.readings||{}).length>0).length || 0
  const coopsCount = Object.keys(waterQuality?.coops||{}).length
  const buoyOk = !!waterQuality?.buoy?.WTMP
  const habProb = habAssessment?.hab?.probability
  const wqStatus = usgsCount>0?'live':'partial'

  const nerrsOk = nerrs?.waterQuality?.available
  const nDO2 = safeNum(nerrs?.waterQuality?.latest?.DO_mgl?.value)
  const nSal = safeNum(nerrs?.waterQuality?.latest?.Sal?.value)
  const nTemp = safeNum(nerrs?.waterQuality?.latest?.Temp?.value)
  const nChl = safeNum(nerrs?.waterQuality?.latest?.ChlFluor?.value)

  const hfOk = hfradar?.available
  const hfSpeed = safeNum(hfradar?.avgSpeed_ms)
  const hfDist14 = safeNum(hfradar?.bloom_transport?.distance_14h_km)

  const aqiOk = aqi?.available
  const aqiVal = aqi?.readings?.[0]?.aqi
  const aqiCat = aqi?.readings?.[0]?.category

  const paceOk = paceStatus?.configured
  const paceGranule = paceStatus?.setupRequired===false

  const methOk = methane?.configured
  const methSat = methane?.satellite

  const openeoOk = openeo?.platform?.configured
  const openeoCredits = openeo?.platform?.credits

  const npdesCount = epaNpdes?.count
  const npdesViolating = epaNpdes?.violating

  const reg = sensors?.summary
  const totalActive = reg?.active || 0
  const totalFeeds = reg?.totalActiveFeeds || 0

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

      <SectionHeader title="Tier 1 — Live Now, No Keys Required" count={totalFeeds} color="#0a9e80" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="USGS NWIS" icon="≋" status={wqStatus} value={usgsCount} unit="stations reporting" badge="6 stations · 9 parameters · Mobile Bay watershed" sub={waterQuality?.usgs?.map(s=>s.name?.split(' at ')[0]).join(', ')} note="Alabama R., Mobile R., Dog R., Fowl R., Escatawpa — no key needed" />
        <FeedCard name="NOAA CO-OPS" icon="↕" status={coopsCount>0?'live':'partial'} value={coopsCount} unit="tidal stations" badge="Dauphin Island · State Docks · Dog River Bridge" sub={`Water level, salinity, temperature · ${waterQuality?.coops?.['8735180']?.salinity?.value?.toFixed(1) ?? '—'} ppt at Dauphin Is.`} note="No key needed" />
        <FeedCard name="NOAA NWS" icon="≈" status={weather?.current?.temp_f!=null?'live':'partial'} value={weather?.current?.temp_f?.toFixed(1)} unit="°F" badge="Mobile Bay forecast + active alerts" sub={weather?.current?.description || 'Fetching...'} note="Wind, pressure, humidity, 7-day forecast · No key" />
        <FeedCard name="NDBC Buoy 42012" icon="◎" status={buoyOk?'live':'partial'} value={waterQuality?.buoy?.WTMP?.toFixed(1)} unit="°C water temp" badge="Offshore Gulf of Mexico · Wave height, wind, pressure" sub={waterQuality?.buoy?.WSPD!=null?`Wind: ${waterQuality.buoy.WSPD} m/s @ ${waterQuality.buoy.WDIR}°`:null} note="No key needed" />
        <FeedCard name="NOAA HF Radar" icon="↻" status={hfOk?'live':'offline'} worldFirst value={hfSpeed?.toFixed(2)} unit="m/s surface current" badge="Gulf of Mexico · Hourly 6km · Bloom trajectory" sub={hfOk ? `${hfradar.directionCardinal} direction · Bloom travels ~${hfDist14?.toFixed(0)} km in 14h` : 'Fetching from ERDDAP...'} note="No key — ERDDAP open data" url="https://coastwatch.pfeg.noaa.gov/erddap/griddap/ucsdHfrE6.html" />
        <FeedCard name="NERRS CDMO — Weeks Bay" icon="🌿" status={nerrsOk?'live':'partial'} worldFirst value={nDO2?.toFixed(2)} unit="mg/L DO₂" badge="Weeks Bay NERR dock sensor · 15-min readings" sub={nerrsOk ? [nTemp&&`Temp: ${nTemp.toFixed(1)}°C`, nSal&&`Sal: ${nSal.toFixed(1)} ppt`, nChl&&`CHL: ${nChl.toFixed(1)} µg/L`].filter(Boolean).join(' · ') : 'Fetching...'} note="No key — your nearest NERR, 15min from Fairhope · Weeks Bay dock instrument" />
        <FeedCard name="EPA ECHO" icon="📋" status={npdesCount>0?'live':'partial'} value={npdesCount} unit="active NPDES permits" badge="Mobile + Baldwin County · Discharge compliance" sub={npdesViolating>0?`⚠ ${npdesViolating} facilities with violations`:'Fetching permit data...'} note="No key — facility compliance history, effluent limits, violations" />
        <FeedCard name="Water Quality Portal" icon="⬡" status="live" badge="Unified USGS + EPA + ADEM + state WQP" sub="Query any water quality parameter across all federal databases" note="No key — GET /api/sensors/epa/wqp?characteristicName=Dissolved+oxygen+(DO)" />
        <FeedCard name="EPA Toxic Release Inventory" icon="⚠" status="live" badge="TRI facilities — Mobile County" sub="Toxic chemical releases — key input for PFAS source attribution" note="No key — annual TRI reporting data via EPA Envirofacts" />
      </div>

      <SectionHeader title="Tier 2 — Free Keys (check Replit Secrets)" count={null} color="#1d6fcc" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="AirNow (AIRNOW_API_KEY)" icon="🌬️" status={aqiOk?'live':aqi?.configured===false?'keyed':'partial'} value={aqiVal} unit="AQI" badge="Dauphin Island + Mobile area monitoring stations" sub={aqiOk ? `${aqiCat} — ${aqi.readings?.map(r=>r.parameter).join(', ')}` : aqi?.configured===false?'Add AIRNOW_API_KEY to Replit Secrets':'Fetching...'} note="Register free at airnowapi.org" url="https://docs.airnowapi.org/" />
        <FeedCard name="NASA PACE OCI" icon="🛰️" status={paceOk?'live':!paceStatus?'partial':'keyed'} worldFirst badge="PACE OCI v3.1 · Daily global · Karenia 588nm band" sub={paceOk ? 'Credentials configured — searching for granules over Mobile Bay' : 'Add NASA_EARTHDATA_USER + NASA_EARTHDATA_PASS to Replit Secrets'} note="Register free at urs.earthdata.nasa.gov · Enables 8-day HAB horizon (CNN-LSTM)" url="https://urs.earthdata.nasa.gov/" />
        <FeedCard name="Sentinel-5P TROPOMI" icon="🌡️" status={methOk?'live':!methane?'partial':'keyed'} badge={methSat || 'Sentinel-5P TROPOMI CH4 · 5.5km daily'} sub={methOk ? 'Copernicus credentials active — TROPOMI methane operational' : 'Add COPERNICUS_USER + COPERNICUS_PASS to Replit Secrets'} note="MethaneSAT satellite lost June 2025. TROPOMI is operational replacement · dataspace.copernicus.eu" url="https://dataspace.copernicus.eu/" />
        <FeedCard name="openEO Algorithm Plaza" icon="🛩️" status={openeoOk?'live':!openeo?'partial':'keyed'} worldFirst badge="8 algorithms — BIOPAR, CropSAR, EVI, MSI, MOGPR, WorldCereal" value={openeoCredits!=null?openeoCredits:null} unit={openeoCredits!=null?'credits remaining':null} sub={openeoOk ? 'Copernicus credentials active — all 8 algorithms available' : 'Add COPERNICUS_USER + COPERNICUS_PASS (same as TROPOMI)'} note="Same credentials as TROPOMI — no new registration · Free tier ~1000 credits/month" />
      </div>

      {openeoOk && openeo?.algorithms && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Copernicus openEO Algorithm Plaza — {openeo.algorithms.criticalReady?.length + openeo.algorithms.mediumReady?.length} Algorithms Active</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(openeo?.platform?.algorithms || []).slice(0,8).map(alg => (
              <div key={alg.id} className={clsx('p-2.5 rounded-lg border text-xs', alg.terrawatch?.priority==='CRITICAL'?'border-red-200 bg-red-50':'border-bay-100 bg-bay-50')}>
                <div className="font-semibold text-bay-800 mb-0.5">{alg.id}</div>
                <div className="text-[10px] text-bay-400 mb-1">{alg.provider} · {alg.resolution}</div>
                <div className={clsx('tw-mono text-[8px] font-bold', alg.terrawatch?.priority==='CRITICAL'?'text-red-600':alg.terrawatch?.priority==='HIGH'?'text-amber-600':'text-bay-400')}>
                  {alg.terrawatch?.priority || 'MEDIUM'} PRIORITY
                </div>
                <div className="text-[9px] text-bay-500 mt-1 leading-tight">{alg.terrawatch?.primary?.substring(0,60)}...</div>
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
          <div className="text-xs text-bay-400 mt-2">
            Station: wekaswq · Weeks Bay National Estuarine Research Reserve · 12 min from Fairhope ·
            <a href="https://cdmo.baruch.sc.edu/" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline ml-1">CDMO Dashboard →</a>
          </div>
        </div>
      )}

      {hfOk && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">NOAA HF Radar — Mobile Bay Current Conditions + Bloom Transport</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l:'Speed', v:hfSpeed?.toFixed(2), u:'m/s' },
              { l:'Speed', v:hfradar.avgSpeed_knots?.toFixed(2), u:'knots' },
              { l:'Direction', v:hfradar.direction_deg, u:`° (${hfradar.directionCardinal})` },
              { l:'Bloom Transport 14h', v:hfDist14?.toFixed(0), u:'km' },
              { l:'Bloom Transport 24h', v:safeNum(hfradar.bloom_transport?.distance_24h_km)?.toFixed(0), u:'km' },
            ].map(s=>(
              <div key={s.l+s.u} className="text-center p-2.5 rounded-lg bg-bay-50">
                <div className="tw-label mb-0.5">{s.l}</div>
                <div className="tw-mono text-lg font-bold text-teal-700">{s.v??'—'}<span className="text-[10px] font-normal text-bay-400 ml-1">{s.u}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-teal-50 border border-teal-200">
            <div className="tw-label text-teal-600 mb-1">Bloom Transport Note</div>
            <div className="text-xs text-teal-800">{hfradar.bloom_transport?.note}</div>
          </div>
        </div>
      )}

      <SectionHeader title="Planned — Hardware + Partnership" count={null} color="#7c3aed" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { name:'eDNA Auto-Samplers', icon:'🧬', when:'Month 6', note:'HAB species before visual detection · oyster pathogens (Dermo, MSX)', worldFirst:true },
          { name:'Passive Acoustic', icon:'🔊', when:'Month 4', note:'Fish spawning condition forecast — black drum, redfish' },
          { name:'LoRaWAN Soil Cond.', icon:'🌱', when:'Month 3', note:'4-8 week saltwater intrusion warning · $3-5K deploy' },
          { name:'MS4 Stormwater IoT', icon:'🌧️', when:'Month 4', note:'First measured nonpoint source loading network' },
          { name:'WBE (MAWSS)', icon:'🏥', when:'Year 2', note:'HAB brevetoxin in wastewater = actual human exposure data', worldFirst:true },
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

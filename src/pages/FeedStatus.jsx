import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, Section } from '../components/Common/index.jsx'
import { AirQualityChart, SatelliteTimelineChart } from '../components/Charts/index.jsx'
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
      {count != null && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded font-bold" style={{background:`${color}15`,color,border:`1px solid ${color}33`}}>{count}</span>}
    </div>
  )
}

function buildSatelliteChartData(sat) {
  if (!sat) return []
  return [
    { name: 'MODIS CHL', granules: sat.modis?.granules || 0, available: sat.modis?.available },
    { name: 'VIIRS OC', granules: sat.viirs?.granules || 0, available: sat.viirs?.available },
    { name: 'HLS L30', granules: sat.hls?.HLSL30?.granules || 0, available: sat.hls?.available },
    { name: 'HLS S30', granules: sat.hls?.HLSS30?.granules || 0, available: sat.hls?.available },
    { name: 'Landsat', granules: sat.landsat?.granules || 0, available: sat.landsat?.available },
    { name: 'Sentinel-2', granules: sat.sentinel2?.granules || 0, available: sat.sentinel2?.available },
  ].filter(d => d.available)
}

function buildAqiChartData(aqiData) {
  if (!aqiData?.readings?.length) return []
  return aqiData.readings.map(r => ({
    parameter: r.parameter || r.ParameterName || 'AQI',
    aqi: r.aqi || r.AQI || 0,
    category: r.category || r.Category?.Name || '',
  }))
}

export default function FeedStatus() {
  const {
    waterQuality, habAssessment, weather, nerrs, hfradar, aqi,
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

  const usgsCount = waterQuality?.usgs?.filter(s=>Object.keys(s.readings||{}).length>0).length || 0
  const coopsCount = Object.keys(waterQuality?.coops||{}).length
  const buoyOk = !!waterQuality?.buoy?.WTMP
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
  const methOk = methane?.configured

  const openeoOk = openeo?.platform?.configured
  const openeoCredits = openeo?.platform?.credits

  const npdesCount = epaNpdes?.count
  const npdesViolating = epaNpdes?.violating

  const goesOk = goesStatus?.status?.available || goesStatus?.status?.imageryAvailable
  const goesSst = safeNum(goesStatus?.status?.latestSST_C)

  const reg = sensors?.summary
  const totalActive = reg?.active || 0
  const totalFeeds = reg?.totalActiveFeeds || 0

  const satData = buildSatelliteChartData(satelliteStatus)
  const aqiChartData = buildAqiChartData(aqi)

  const satSourceCount = satelliteStatus?.totalSources || 0
  const oceanSourceCount = oceanStatus?.totalSources || 0
  const ecoSourceCount = ecologyStatus?.totalSources || 0

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

      <SectionHeader title="Water Quality & Tidal" count={`${usgsCount + coopsCount + (buoyOk?1:0)} reporting`} color="#0a9e80" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="USGS NWIS" icon="≋" status={wqStatus} value={usgsCount} unit="stations reporting" badge="6 stations · 9 parameters · Mobile Bay watershed" sub={waterQuality?.usgs?.map(s=>s.name?.split(' at ')[0]).join(', ')} note="Alabama R., Mobile R., Dog R., Fowl R., Escatawpa — no key needed" />
        <FeedCard name="NOAA CO-OPS" icon="↕" status={coopsCount>0?'live':'partial'} value={coopsCount} unit="tidal stations" badge="Dauphin Island · State Docks · Dog River Bridge" sub={`Water level, salinity, temperature · ${waterQuality?.coops?.['8735180']?.salinity?.value?.toFixed(1) ?? '—'} ppt at Dauphin Is.`} note="No key needed" />
        <FeedCard name="NDBC Buoy 42012" icon="◎" status={buoyOk?'live':'partial'} value={waterQuality?.buoy?.WTMP?.toFixed(1)} unit="°C water temp" badge="Offshore Gulf of Mexico" sub={waterQuality?.buoy?.WSPD!=null?`Wind: ${waterQuality.buoy.WSPD} m/s @ ${waterQuality.buoy.WDIR}°`:null} note="No key needed" />
        <FeedCard name="NERRS Weeks Bay" icon="🌿" status={nerrsOk?'live':'partial'} worldFirst value={nDO2?.toFixed(2)} unit="mg/L DO₂" badge="15-min readings · Weeks Bay dock" sub={nerrsOk ? [nTemp&&`Temp: ${nTemp.toFixed(1)}°C`, nSal&&`Sal: ${nSal.toFixed(1)} ppt`, nChl&&`CHL: ${nChl.toFixed(1)} µg/L`].filter(Boolean).join(' · ') : 'Fetching...'} note="No key — nearest NERR to Mobile Bay" />
      </div>

      <SectionHeader title="Weather & Atmospheric" count={`${(weather?.current?.temp_f!=null?1:0)+(aqiOk?1:0)+(airplusStatus?Object.keys(airplusStatus).length-1:0)} sources`} color="#7c3aed" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="NOAA NWS" icon="≈" status={weather?.current?.temp_f!=null?'live':'partial'} value={weather?.current?.temp_f?.toFixed(1)} unit="°F" badge="Mobile Bay forecast + active alerts" sub={weather?.current?.description || 'Fetching...'} note="Wind, pressure, humidity, 7-day forecast" />
        <FeedCard name="AirNow AQI" icon="🌬️" status={aqiOk?'live':aqi?.configured===false?'keyed':'partial'} value={aqiVal} unit="AQI" badge="Dauphin Island + Mobile" sub={aqiOk ? `${aqiCat} — ${aqi.readings?.map(r=>r.parameter).join(', ')}` : 'Add AIRNOW_API_KEY'} note="airnowapi.org" />
        {airplusStatus?.openAQ && <FeedCard name="OpenAQ" icon="🌐" status={airplusStatus.openAQ.available?'live':'partial'} badge="Global air quality aggregator" sub={airplusStatus.openAQ.product || 'OpenAQ readings'} note="No key needed" />}
        {airplusStatus?.purpleAir && <FeedCard name="PurpleAir" icon="💜" status={airplusStatus.purpleAir.available?'live':airplusStatus.purpleAir.configured===false?'keyed':'partial'} badge="Hyperlocal PM2.5" sub="PurpleAir sensor network" note="PURPLEAIR_API_KEY required" />}
      </div>

      {aqiChartData.length > 0 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Air Quality Index — Current Readings</div>
          <AirQualityChart data={aqiChartData} />
        </div>
      )}

      <SectionHeader title="Currents & Ocean Models" count={`${oceanSourceCount} sources`} color="#1d6fcc" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="HF Radar" icon="↻" status={hfOk?'live':'offline'} worldFirst value={hfSpeed?.toFixed(2)} unit="m/s" badge="Gulf surface currents · Bloom trajectory" sub={hfOk ? `${hfradar.directionCardinal} · ~${hfDist14?.toFixed(0)} km in 14h` : 'Fetching...'} />
        {oceanStatus?.hycom && <FeedCard name="HYCOM Ocean" icon="🌊" status={oceanStatus.hycom.available?'live':'partial'} badge="1/12° global ocean model" sub={oceanStatus.hycom.product || 'HYCOM surface conditions'} note={oceanStatus.hycom.note} />}
        {oceanStatus?.coastwatch && <FeedCard name="CoastWatch ERDDAP" icon="🛟" status={oceanStatus.coastwatch.available?'live':'partial'} badge="MODIS CHL-a 4km composite" sub={oceanStatus.coastwatch.product || 'CoastWatch chlorophyll'} />}
        {oceanStatus?.cmems && <FeedCard name="CMEMS Physics" icon="🌏" status={oceanStatus.cmems.available?'live':'keyed'} badge="Copernicus Marine Service" sub={oceanStatus.cmems.product || 'CMEMS ocean physics'} note={oceanStatus.cmems.note} />}
        {oceanStatus?.digitalcoast && <FeedCard name="Digital Coast" icon="🏖️" status={oceanStatus.digitalcoast.available?'live':'partial'} badge="NOAA coastal data" sub={`${oceanStatus.digitalcoast.datasets||0} datasets`} />}
        {oceanStatus?.streamstats && <FeedCard name="StreamStats" icon="💧" status="live" badge="USGS watershed delineation" sub="On-demand by coordinate" />}
      </div>

      <SectionHeader title="Satellite Imagery & Remote Sensing" count={`${satSourceCount + (goesOk?1:0)} sources`} color="#d97706" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <FeedCard name="GOES-19 ABI" icon="🛰️" status={goesOk?'live':'partial'} value={goesSst?.toFixed(1)} unit="°C SST" badge="Geostationary · 2km hourly" sub={goesStatus?.status?.product || 'GOES-19 satellite'} note="No key — NOAA STAR CDN" />
        <FeedCard name="NASA PACE OCI" icon="🛰️" status={paceOk?'live':!paceStatus?'partial':'keyed'} worldFirst badge="PACE OCI v3.1 · Karenia 588nm" sub={paceOk ? 'Credentials active' : 'NASA_EARTHDATA_USER+PASS'} />
        <FeedCard name="TROPOMI CH4" icon="🌡️" status={methOk?'live':!methane?'partial':'keyed'} badge="Sentinel-5P · 5.5km daily" sub={methOk ? 'TROPOMI operational' : 'COPERNICUS_USER+PASS'} />
        {satelliteStatus?.modis && <FeedCard name="MODIS CHL" icon="🌊" status={satelliteStatus.modis.available?'live':'keyed'} value={satelliteStatus.modis.granules} unit="granules" badge="Aqua · 1km daily" sub={satelliteStatus.modis.product} />}
        {satelliteStatus?.viirs && <FeedCard name="VIIRS OC" icon="🔭" status={satelliteStatus.viirs.available?'live':'keyed'} value={satelliteStatus.viirs.granules} unit="granules" badge="Suomi-NPP ocean color" sub={satelliteStatus.viirs.product} />}
        {satelliteStatus?.hls && <FeedCard name="NASA HLS" icon="📡" status={satelliteStatus.hls.available?'live':'keyed'} badge="Landsat + Sentinel-2 30m" sub={satelliteStatus.hls.product} />}
        {satelliteStatus?.landsat && <FeedCard name="Landsat C2" icon="🗺️" status={satelliteStatus.landsat.available?'live':'keyed'} value={satelliteStatus.landsat.granules} unit="granules" badge="30m 11-band" sub={satelliteStatus.landsat.product} />}
        {satelliteStatus?.sentinel2 && <FeedCard name="Sentinel-2" icon="🛸" status={satelliteStatus.sentinel2.available?'live':'keyed'} value={satelliteStatus.sentinel2.granules} unit="granules" badge="10m 13-band" sub={satelliteStatus.sentinel2.product} />}
        {satelliteStatus?.dem && <FeedCard name="Copernicus DEM" icon="⛰️" status="live" badge="GLO-30 · 30m global" sub={satelliteStatus.dem.product} note="No auth required" />}
      </div>

      {satData.length > 0 && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">Satellite Granule Availability — Last 7 Days</div>
          <SatelliteTimelineChart data={satData} />
        </div>
      )}

      {goesStatus?.imagery?.available && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">GOES-19 Gulf of Mexico — Latest GEOCOLOR</div>
          <div className="flex items-center gap-4 flex-wrap">
            <a href={goesStatus.imagery.imageUrl} target="_blank" rel="noreferrer" className="tw-btn-primary text-xs">View Latest Image →</a>
            <a href={goesStatus.imagery.animationUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">View Animation (GIF) →</a>
            <span className="tw-mono text-[9px] text-bay-300">Refresh: {goesStatus.imagery.refreshRate}</span>
          </div>
        </div>
      )}

      <SectionHeader title="Ecology & Biodiversity" count={`${ecoSourceCount} sources`} color="#16a34a" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {ecologyStatus?.iNaturalist && <FeedCard name="iNaturalist" icon="🦎" status={ecologyStatus.iNaturalist.available?'live':'partial'} value={ecologyStatus.iNaturalist.totalCount} unit="observations" badge="Research grade · Mobile Bay" sub={`${ecologyStatus.iNaturalist.daysBack || 7}-day window`} note="No key needed" />}
        {ecologyStatus?.gbif && <FeedCard name="GBIF" icon="🌍" status={ecologyStatus.gbif.available?'live':'partial'} value={ecologyStatus.gbif.totalCount} unit="occurrences" badge="Global biodiversity records" sub="90-day window" note="No key needed" />}
        {ecologyStatus?.eBird && <FeedCard name="eBird" icon="🐦" status={ecologyStatus.eBird.available?'live':'keyed'} value={ecologyStatus.eBird.mobileBayObs} unit="Mobile Bay obs" badge="Cornell Lab ornithology" sub={ecologyStatus.eBird.available ? `${ecologyStatus.eBird.species?.length || 0} species` : 'EBIRD_API_KEY required'} />}
        {ecologyStatus?.ameriflux && <FeedCard name="AmeriFlux" icon="🏗️" status={ecologyStatus.ameriflux.configured?'live':'keyed'} worldFirst badge="CO₂/CH₄ flux towers" sub={ecologyStatus.ameriflux.product || 'Eddy covariance'} note={ecologyStatus.ameriflux.nearestSite} />}
      </div>

      <SectionHeader title="Land & Regulatory" count={`${landStatus ? Object.keys(landStatus).length - 1 : 0} sources`} color="#92400e" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {landStatus?.openMeteo && <FeedCard name="Open-Meteo" icon="☀️" status={landStatus.openMeteo.available?'live':'partial'} badge="7-day forecast · Hourly" sub={landStatus.openMeteo.product || 'Weather model'} note="No key needed" />}
        {landStatus?.ahps && <FeedCard name="NOAA AHPS" icon="🌊" status={landStatus.ahps.available?'live':'partial'} badge="Flood stage monitoring" sub={landStatus.ahps.product || 'AHPS flood'} />}
        {landStatus?.fema && <FeedCard name="FEMA Flood Zones" icon="🗺️" status={landStatus.fema.available?'live':'partial'} badge="FIRM regulatory maps" sub={landStatus.fema.product || 'FEMA FIRM'} />}
        {landStatus?.nwi && <FeedCard name="NWI Wetlands" icon="🌾" status={landStatus.nwi.available?'live':'partial'} badge="USFWS wetland inventory" sub={landStatus.nwi.product || 'NWI data'} />}
        {landStatus?.attains && <FeedCard name="EPA ATTAINS" icon="📊" status={landStatus.attains.available?'live':'partial'} badge="Impaired waters 303(d)" sub={landStatus.attains.product || 'ATTAINS waterbodies'} />}
        <FeedCard name="EPA ECHO" icon="📋" status={npdesCount>0?'live':'partial'} value={npdesCount} unit="NPDES permits" badge="Discharge compliance" sub={npdesViolating>0?`⚠ ${npdesViolating} with violations`:'Fetching...'} />
        <FeedCard name="WQ Portal" icon="⬡" status="live" badge="USGS + EPA + state WQP" sub="Unified water quality queries" note="No key needed" />
        <FeedCard name="EPA TRI" icon="⚠" status="live" badge="Toxic Release Inventory" sub="Chemical releases · Mobile County" />
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

      {hfOk && (
        <div className="tw-card mb-6">
          <div className="tw-label mb-3">NOAA HF Radar — Current Conditions + Bloom Transport</div>
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

      <SectionHeader title="Planned — Hardware + Partnership" count={null} color="#7c3aed" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { name:'eDNA Auto-Samplers', icon:'🧬', when:'Month 6', note:'HAB species before visual detection · oyster pathogens', worldFirst:true },
          { name:'Passive Acoustic', icon:'🔊', when:'Month 4', note:'Fish spawning condition forecast — black drum, redfish' },
          { name:'LoRaWAN Soil', icon:'🌱', when:'Month 3', note:'4-8 week saltwater intrusion warning' },
          { name:'MS4 Stormwater IoT', icon:'🌧️', when:'Month 4', note:'First measured nonpoint source loading network' },
          { name:'WBE (MAWSS)', icon:'🏥', when:'Year 2', note:'HAB brevetoxin in wastewater = human exposure data', worldFirst:true },
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

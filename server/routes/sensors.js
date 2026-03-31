import express from 'express'
import { getCurrentSummary, getMobileBayCurrents } from '../services/hfradar.js'
import { getWeeksBayLatest, getWeeksBayTimeSeries } from '../services/nerrs.js'
import { getPaceStatus, getPaceHabSignal, searchPaceGranules } from '../services/pace.js'
import { getMethaneStatus, searchTROPOMIGranules } from '../services/tropomi.js'
import { getMobileBayNPDESFacilities, getWQPResults, getMobileAQI, getTRIFacilities } from '../services/epa.js'
import { getGOES19Status, getGOES19LatestImage, getAllGOESStatus } from '../services/goes.js'
import axios from 'axios'

const router = express.Router()

function hasEnv(...keys) { return keys.every(k => !!process.env[k]) }

function buildSensorRegistry() {
  const nasaCreds = hasEnv('NASA_EARTHDATA_USER','NASA_EARTHDATA_PASS')
  const copCreds  = hasEnv('COPERNICUS_USER','COPERNICUS_PASS')
  const airnowKey = hasEnv('AIRNOW_API_KEY')
  const anthropicKey = hasEnv('ANTHROPIC_API_KEY')
  const vexcelKey = hasEnv('VEXCEL_API_KEY')
  const ebirdKey  = hasEnv('EBIRD_API_KEY')
  const aqsCreds  = hasEnv('AQS_EMAIL','AQS_API_KEY')
  const nceiKey   = hasEnv('NCEI_API_KEY')
  const purpleKey = hasEnv('PURPLEAIR_API_KEY')
  const ameriToken= hasEnv('AMERIFLUX_TOKEN')

  return [
    { id:'usgs_nwis',    name:'USGS NWIS',               type:'water_quality', status:'active',       feeds:22, cost:'free',      auth:'none' },
    { id:'noaa_coops',   name:'NOAA CO-OPS',             type:'tidal',         status:'active',       feeds:4,  cost:'free',      auth:'none' },
    { id:'noaa_nws',     name:'NOAA NWS',                type:'weather',       status:'active',       feeds:1,  cost:'free',      auth:'none' },
    { id:'noaa_ndbc',    name:'NOAA NDBC Buoys',         type:'offshore',      status:'active',       feeds:1,  cost:'free',      auth:'none' },
    { id:'noaa_hf_radar',name:'NOAA HF Radar (CoSMO)',   type:'currents',      status:'active',       feeds:1,  cost:'free',      auth:'none',      worldFirst:true },
    { id:'nerrs_cdmo',   name:'NERRS CDMO — Weeks Bay',  type:'estuarine',     status:'active',       feeds:12, cost:'free',      auth:'none' },
    { id:'epa_echo',     name:'EPA ECHO',                type:'compliance',    status:'active',       feeds:1,  cost:'free',      auth:'none' },
    { id:'wqp',          name:'Water Quality Portal',    type:'water_quality', status:'active',       feeds:1,  cost:'free',      auth:'none' },
    { id:'epa_tri',      name:'EPA Toxic Release Inv.',  type:'pollution',     status:'active',       feeds:1,  cost:'free',      auth:'none' },
    { id:'nasa_pace',    name:'NASA PACE OCI',           type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:3,  cost:'free', auth:'NASA_EARTHDATA_USER+PASS', worldFirst:true },
    { id:'tropomi_ch4',  name:'Sentinel-5P TROPOMI CH4',type:'atmospheric',   status:(copCreds || nasaCreds) ? 'active' : 'key_required', feeds:1, cost:'free', auth:'COPERNICUS_USER+PASS or NASA creds' },
    { id:'airnow',       name:'AirNow API',             type:'air_quality',   status:airnowKey ? 'active' : 'key_required', feeds:1, cost:'free', auth:'AIRNOW_API_KEY' },

    { id:'modis_chl',    name:'MODIS Aqua Chlorophyll',  type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'modis_sst',    name:'MODIS Aqua SST',          type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'viirs_oc',     name:'VIIRS Ocean Color',       type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'viirs_dnb',    name:'VIIRS Nighttime Lights',  type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'hls',          name:'NASA HLS (Landsat+S2)',   type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:2, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'landsat',      name:'Landsat Collection 2',    type:'satellite',     status:nasaCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NASA_EARTHDATA_USER+PASS' },
    { id:'sentinel2',    name:'Sentinel-2 L2A (10m)',    type:'satellite',     status:copCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'COPERNICUS_USER+PASS' },
    { id:'goes19',       name:'GOES-19 ABI',             type:'satellite',     status:'active',       feeds:2, cost:'free', auth:'none' },
    { id:'cop_dem',      name:'Copernicus DEM GLO-30',   type:'elevation',     status:'active',       feeds:1, cost:'free', auth:'none' },

    { id:'cmems_phys',   name:'CMEMS Ocean Physics',     type:'ocean_model',   status:copCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'COPERNICUS_USER+PASS' },
    { id:'cmems_bgc',    name:'CMEMS Biogeochemistry',   type:'ocean_model',   status:copCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'COPERNICUS_USER+PASS' },
    { id:'hycom',        name:'HYCOM Ocean Model',       type:'ocean_model',   status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'coastwatch',   name:'NOAA CoastWatch ERDDAP',  type:'ocean_obs',     status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'streamstats',  name:'USGS StreamStats',        type:'hydrology',     status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'digitalcoast', name:'NOAA Digital Coast',      type:'coastal',       status:'active',       feeds:1, cost:'free', auth:'none' },

    { id:'inaturalist',  name:'iNaturalist',             type:'biodiversity',  status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'gbif',         name:'GBIF Occurrences',        type:'biodiversity',  status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'ebird',        name:'eBird Cornell Lab',       type:'biodiversity',  status:ebirdKey ? 'active' : 'key_required', feeds:1, cost:'free', auth:'EBIRD_API_KEY' },
    { id:'ameriflux',    name:'AmeriFlux Flux Towers',   type:'carbon',        status:ameriToken ? 'active' : 'key_required', feeds:1, cost:'free', auth:'AMERIFLUX_TOKEN', worldFirst:true },

    { id:'openmeteo',    name:'Open-Meteo Weather',      type:'weather',       status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'noaa_ahps',    name:'NOAA AHPS Flood Stage',   type:'hydrology',     status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'ncei',         name:'NOAA NCEI Climate',       type:'climate',       status:nceiKey ? 'active' : 'key_required', feeds:1, cost:'free', auth:'NCEI_API_KEY' },
    { id:'ssurgo',       name:'NRCS SSURGO Soils',       type:'land',          status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'nwi',          name:'USGS NWI Wetlands',       type:'land',          status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'fema_firm',    name:'FEMA FIRM Flood Zones',   type:'regulatory',    status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'nlcd',         name:'NLCD Land Cover',          type:'land',          status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'epa_attains',  name:'EPA ATTAINS Impaired Waters', type:'regulatory', status:'active',      feeds:1, cost:'free', auth:'none' },
    { id:'usace_orm',    name:'USACE Regulatory ORM',    type:'regulatory',    status:'active',       feeds:1, cost:'free', auth:'none' },

    { id:'epa_aqs',      name:'EPA AQS Official Monitors',type:'air_quality', status:aqsCreds ? 'active' : 'key_required', feeds:1, cost:'free', auth:'AQS_EMAIL+AQS_API_KEY' },
    { id:'openaq',       name:'OpenAQ Global Aggregator', type:'air_quality',  status:'active',       feeds:1, cost:'free', auth:'none' },
    { id:'purpleair',    name:'PurpleAir PM2.5 Network',  type:'air_quality',  status:purpleKey ? 'active' : 'key_required', feeds:1, cost:'free', auth:'PURPLEAIR_API_KEY' },

    { id:'anthropic',    name:'Claude AI Assistant',    type:'ai',            status:anthropicKey ? 'active' : 'key_required', feeds:1, cost:'paid', auth:'ANTHROPIC_API_KEY' },
    { id:'edna_sampler', name:'eDNA Auto-Samplers',     type:'biological',    status:'planned_month6',feeds:1, cost:'hardware',  auth:'none',      worldFirst:true },
    { id:'hydrophone',   name:'Passive Acoustic Monitor',type:'acoustic',     status:'planned_month4',feeds:1, cost:'hardware',  auth:'none' },
    { id:'lora_soil',    name:'LoRaWAN Soil Conductivity',type:'groundwater', status:'planned_month3',feeds:15,cost:'hardware',  auth:'none' },
    { id:'ms4_iot',      name:'MS4 Stormwater IoT',    type:'stormwater',    status:'planned_month4',feeds:30, cost:'partnership',auth:'none' },
    { id:'wbe_mawss',    name:'Wastewater Epid. (WBE)', type:'public_health', status:'planned_year2', feeds:1, cost:'partnership',auth:'none', worldFirst:true },
    { id:'osprey',       name:'Osprey (Litter Gitter)', type:'microplastic',  status:'partnership',   feeds:1, cost:'partnership',auth:'none', worldFirst:true },
    { id:'vexcel',       name:'Vexcel Data Program',    type:'aerial_imagery',status:vexcelKey ? 'active' : 'evaluation', feeds:7, cost:'paid_800mo', auth:'VEXCEL_API_KEY' },
  ]
}

router.get('/registry', (req,res) => {
  const registry = buildSensorRegistry()
  const active  = registry.filter(s=>s.status==='active')
  const keyed   = registry.filter(s=>s.status==='key_required')
  const planned = registry.filter(s=>s.status.startsWith('planned'))
  res.json({
    sensors: registry,
    summary:{ total:registry.length, active:active.length, keyRequired:keyed.length, planned:planned.length, worldFirsts:registry.filter(s=>s.worldFirst).length, totalActiveFeeds:active.reduce((a,s)=>a+(s.feeds||0),0) },
    envRequired:[
      { key:'NASA_EARTHDATA_USER', desc:'NASA PACE OCI + MODIS + VIIRS + HLS + Landsat', register:'urs.earthdata.nasa.gov', required:false },
      { key:'NASA_EARTHDATA_PASS', desc:'NASA Earthdata password',                        register:'urs.earthdata.nasa.gov', required:false },
      { key:'COPERNICUS_USER',     desc:'Sentinel-2 + TROPOMI + CMEMS ocean',             register:'dataspace.copernicus.eu', required:false },
      { key:'COPERNICUS_PASS',     desc:'Copernicus password',                             register:'dataspace.copernicus.eu', required:false },
      { key:'AIRNOW_API_KEY',      desc:'Real-time air quality index',                     register:'airnowapi.org',           required:false },
      { key:'EBIRD_API_KEY',       desc:'eBird Cornell Lab bird observations',             register:'ebird.org/api/keygen',    required:false },
      { key:'AQS_EMAIL',           desc:'EPA AQS official monitor data (email)',            register:'aqs.epa.gov/data/api/signup', required:false },
      { key:'AQS_API_KEY',         desc:'EPA AQS official monitor data (key)',              register:'aqs.epa.gov/data/api/signup', required:false },
      { key:'NCEI_API_KEY',        desc:'NOAA NCEI historical climate archive',             register:'ncdc.noaa.gov/cdo-web/token', required:false },
      { key:'PURPLEAIR_API_KEY',   desc:'PurpleAir hyperlocal PM2.5 network',              register:'develop.purpleair.com',        required:false },
      { key:'AMERIFLUX_TOKEN',     desc:'AmeriFlux CO₂/CH₄ flux tower data',              register:'ameriflux.lbl.gov/data/register-data-usage', required:false },
      { key:'ANTHROPIC_API_KEY',   desc:'AI Field Assistant (Claude)',                     register:'console.anthropic.com',   required:false },
      { key:'VEXCEL_API_KEY',      desc:'7.5cm aerial imagery + DTM',                     register:'vexceldata.com/contact',  required:false },
    ],
    timestamp:new Date().toISOString(),
  })
})

router.get('/hfradar/summary', async(req,res)=>{ try{ res.json(await getCurrentSummary()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/hfradar/vectors', async(req,res)=>{ try{ res.json(await getMobileBayCurrents(req.query.res||'6km')) }catch(e){ res.status(500).json({error:e.message}) } })

router.get('/nerrs/latest',     async(req,res)=>{ try{ res.json(await getWeeksBayLatest()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/nerrs/timeseries', async(req,res)=>{ try{ res.json(await getWeeksBayTimeSeries(req.query.param||'DO_mgl', parseInt(req.query.days)||7)) }catch(e){ res.status(500).json({error:e.message}) } })

router.get('/pace/status',    async(req,res)=>{ try{ res.json(await getPaceStatus()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/pace/hab-signal',async(req,res)=>{ try{ res.json(await getPaceHabSignal()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/pace/granules',  async(req,res)=>{ try{ res.json(await searchPaceGranules('PACE_OCI_L3M_CHL_NRT', parseInt(req.query.days)||3)) }catch(e){ res.status(500).json({error:e.message}) } })

router.get('/methane/status',  async(req,res)=>{ try{ res.json(await getMethaneStatus()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/methane/granules',async(req,res)=>{ try{ res.json(await searchTROPOMIGranules(parseInt(req.query.days)||5)) }catch(e){ res.status(500).json({error:e.message}) } })

router.get('/epa/npdes', async(req,res)=>{ try{ res.json(await getMobileBayNPDESFacilities()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/epa/wqp',   async(req,res)=>{ try{ res.json(await getWQPResults(req.query)) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/epa/aqi',   async(req,res)=>{ try{ res.json(await getMobileAQI()) }catch(e){ res.status(500).json({error:e.message}) } })
router.get('/epa/tri',   async(req,res)=>{ try{ res.json(await getTRIFacilities()) }catch(e){ res.status(500).json({error:e.message}) } })

router.get('/status', async(req,res)=>{
  const [hf,nerrs,pace,methane] = await Promise.allSettled([getCurrentSummary(),getWeeksBayLatest(),getPaceStatus(),getMethaneStatus()])
  res.json({ hfRadar:{ok:hf.value?.available,data:hf.value}, nerrs:{ok:nerrs.value?.waterQuality?.available,data:nerrs.value}, pace:{ok:pace.value?.configured,data:pace.value}, methane:{ok:methane.value?.configured,data:methane.value}, timestamp:new Date().toISOString() })
})

let openeoMod = null
const getOpenEO = async () => {
  if (!openeoMod) openeoMod = await import('../services/openeo.js')
  return openeoMod
}

router.get('/openeo/status', async (req, res) => {
  try { const m = await getOpenEO(); res.json(await m.getAllOpenEOStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/openeo/catalog', async (req, res) => {
  try { const m = await getOpenEO(); res.json({ algorithms: m.ALGORITHM_CATALOG }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/openeo/biopar', async (req, res) => {
  try { const m = await getOpenEO(); res.json(await m.getBIOPAR(parseInt(req.query.days) || 15)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/openeo/evi', async (req, res) => {
  try { const m = await getOpenEO(); res.json(await m.getEVI(parseInt(req.query.days) || 10)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/openeo/msi', async (req, res) => {
  try { const m = await getOpenEO(); res.json(await m.getMSI(parseInt(req.query.days) || 10)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

let satelliteMod = null, oceanMod = null, ecologyMod = null, landMod = null, airplusMod = null
const getSatellite = async () => { if (!satelliteMod) satelliteMod = await import('../services/satellite.js'); return satelliteMod }
const getOcean     = async () => { if (!oceanMod) oceanMod = await import('../services/ocean.js'); return oceanMod }
const getEcology   = async () => { if (!ecologyMod) ecologyMod = await import('../services/ecology.js'); return ecologyMod }
const getLand      = async () => { if (!landMod) landMod = await import('../services/landregweather.js'); return landMod }
const getAirPlus   = async () => { if (!airplusMod) airplusMod = await import('../services/airplus.js'); return airplusMod }

router.get('/satellite/status', async (req, res) => {
  try { const m = await getSatellite(); res.json(await m.getAllSatelliteStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/ocean/status', async (req, res) => {
  try { const m = await getOcean(); res.json(await m.getAllOceanStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/ecology/status', async (req, res) => {
  try { const m = await getEcology(); res.json(await m.getAllEcologyStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/ecology/inaturalist', async (req, res) => {
  try { const m = await getEcology(); res.json(await m.getInaturalistObservations(req.query.taxon || null, parseInt(req.query.days) || 30)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/ecology/gbif', async (req, res) => {
  try { const m = await getEcology(); res.json(await m.getGBIFOccurrences(req.query.species || null, parseInt(req.query.days) || 365)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/ecology/ebird', async (req, res) => {
  try { const m = await getEcology(); res.json(await m.getEBirdRecentObservations(req.query.region || 'US-AL', parseInt(req.query.days) || 7)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/land/status', async (req, res) => {
  try { const m = await getLand(); res.json(await m.getAllLandRegWeatherStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/land/weather', async (req, res) => {
  try { const m = await getLand(); res.json(await m.getOpenMeteoWeather(parseFloat(req.query.lat) || 30.5, parseFloat(req.query.lon) || -88.0)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/land/flood', async (req, res) => {
  try { const m = await getLand(); res.json(await m.getFEMAFloodZone(parseFloat(req.query.lat) || 30.5, parseFloat(req.query.lon) || -88.0)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/land/wetlands', async (req, res) => {
  try { const m = await getLand(); res.json(await m.getNWIWetlands(parseFloat(req.query.lat) || 30.5, parseFloat(req.query.lon) || -88.0)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/land/attains', async (req, res) => {
  try { const m = await getLand(); res.json(await m.getATTAINSWaterbodies(req.query.huc || '03160203')) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/airplus/status', async (req, res) => {
  try { const m = await getAirPlus(); res.json(await m.getAllAirQualityStatus()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/airplus/openaq', async (req, res) => {
  try { const m = await getAirPlus(); res.json(await m.getOpenAQReadings(parseFloat(req.query.lat) || 30.5, parseFloat(req.query.lon) || -88.0)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/airplus/purpleair', async (req, res) => {
  try { const m = await getAirPlus(); res.json(await m.getPurpleAirReadings()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/goes/status', async (req, res) => {
  try { res.json(await getGOES19Status()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/goes/image', async (req, res) => {
  try { res.json(await getGOES19LatestImage(req.query.sector || 'gm', req.query.band || 'GEOCOLOR')) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/goes/all', async (req, res) => {
  try {
    const [goesResult, pushRes] = await Promise.allSettled([
      getAllGOESStatus(),
      fetch(`http://localhost:${process.env.PORT || 3001}/api/goes19/push-latest`).then(r => r.json()),
    ])
    const goes = goesResult.status === 'fulfilled' ? goesResult.value : { status: { available: false }, imagery: { available: false } }
    const push = pushRes.status === 'fulfilled' ? pushRes.value : {}

    const hasErddapSST = goes.status?.latestSST_C != null
    const hasPushSST = push.sst_mean != null

    if (!hasErddapSST && hasPushSST) {
      goes.status = {
        ...goes.status,
        latestSST_C: push.sst_mean,
        source: 'push',
      }
    }

    goes.push = {
      available: Object.keys(push).length > 0 && [push.sst_mean, push.sst_gradient, push.qpe_rainfall, push.cloud_coverage, push.glm_flashes, push.bloom_index, push.amv_wind_speed, push.turbidity_idx].some(v => v != null),
      sst_mean: push.sst_mean ?? null,
      sst_gradient: push.sst_gradient ?? null,
      qpe_rainfall: push.qpe_rainfall ?? null,
      qpe_6h: push.qpe_6h ?? null,
      qpe_24h: push.qpe_24h ?? null,
      cloud_coverage: push.cloud_coverage ?? null,
      glm_flashes: push.glm_flashes ?? null,
      glm_active: push.glm_active ?? null,
      amv_wind_speed: push.amv_wind_speed ?? null,
      amv_wind_dir: push.amv_wind_dir ?? null,
      bloom_index: push.bloom_index ?? null,
      turbidity_idx: push.turbidity_idx ?? null,
    }

    res.json(goes)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router

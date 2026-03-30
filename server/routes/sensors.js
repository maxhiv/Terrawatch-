import express from 'express'
import { getCurrentSummary, getMobileBayCurrents } from '../services/hfradar.js'
import { getWeeksBayLatest, getWeeksBayTimeSeries } from '../services/nerrs.js'
import { getPaceStatus, getPaceHabSignal, searchPaceGranules } from '../services/pace.js'
import { getMethaneStatus, searchTROPOMIGranules } from '../services/tropomi.js'
import { getMobileBayNPDESFacilities, getWQPResults, getMobileAQI, getTRIFacilities } from '../services/epa.js'
import axios from 'axios'

const router = express.Router()

const SENSOR_REGISTRY = [
  { id:'usgs_nwis',    name:'USGS NWIS',               type:'water_quality', status:'active',       feeds:22, cost:'free',      auth:'none' },
  { id:'noaa_coops',   name:'NOAA CO-OPS',             type:'tidal',         status:'active',       feeds:4,  cost:'free',      auth:'none' },
  { id:'noaa_nws',     name:'NOAA NWS',                type:'weather',       status:'active',       feeds:1,  cost:'free',      auth:'none' },
  { id:'noaa_ndbc',    name:'NOAA NDBC Buoys',         type:'offshore',      status:'active',       feeds:1,  cost:'free',      auth:'none' },
  { id:'noaa_hf_radar',name:'NOAA HF Radar (CoSMO)',   type:'currents',      status:'active',       feeds:1,  cost:'free',      auth:'none',      worldFirst:true },
  { id:'nerrs_cdmo',   name:'NERRS CDMO — Weeks Bay',  type:'estuarine',     status:'active',       feeds:12, cost:'free',      auth:'none' },
  { id:'epa_echo',     name:'EPA ECHO',                type:'compliance',    status:'active',       feeds:1,  cost:'free',      auth:'none' },
  { id:'wqp',          name:'Water Quality Portal',    type:'water_quality', status:'active',       feeds:1,  cost:'free',      auth:'none' },
  { id:'epa_tri',      name:'EPA Toxic Release Inv.',  type:'pollution',     status:'active',       feeds:1,  cost:'free',      auth:'none' },
  { id:'nasa_pace',    name:'NASA PACE OCI',           type:'satellite',     status:'key_required', feeds:3,  cost:'free',      auth:'NASA_EARTHDATA_USER+PASS', worldFirst:true },
  { id:'tropomi_ch4',  name:'Sentinel-5P TROPOMI CH4',type:'atmospheric',   status:'key_required', feeds:1,  cost:'free',      auth:'COPERNICUS_USER+PASS or NASA creds' },
  { id:'airnow',       name:'AirNow API',             type:'air_quality',   status:'key_required', feeds:1,  cost:'free',      auth:'AIRNOW_API_KEY' },
  { id:'anthropic',    name:'Claude AI Assistant',    type:'ai',            status:'active',       feeds:1,  cost:'paid',      auth:'ANTHROPIC_API_KEY' },
  { id:'edna_sampler', name:'eDNA Auto-Samplers',     type:'biological',    status:'planned_month6',feeds:1, cost:'hardware',  auth:'none',      worldFirst:true },
  { id:'hydrophone',   name:'Passive Acoustic Monitor',type:'acoustic',     status:'planned_month4',feeds:1, cost:'hardware',  auth:'none' },
  { id:'lora_soil',    name:'LoRaWAN Soil Conductivity',type:'groundwater', status:'planned_month3',feeds:15,cost:'hardware',  auth:'none' },
  { id:'ms4_iot',      name:'MS4 Stormwater IoT',    type:'stormwater',    status:'planned_month4',feeds:30, cost:'partnership',auth:'none' },
  { id:'wbe_mawss',    name:'Wastewater Epid. (WBE)', type:'public_health', status:'planned_year2', feeds:1, cost:'partnership',auth:'none', worldFirst:true },
  { id:'ameriflux',    name:'AmeriFlux Flux Towers',  type:'carbon',        status:'planned_year2', feeds:1, cost:'partnership',auth:'none', worldFirst:true },
  { id:'osprey',       name:'Osprey (Litter Gitter)', type:'microplastic',  status:'partnership',   feeds:1, cost:'partnership',auth:'none', worldFirst:true },
  { id:'vexcel',       name:'Vexcel Data Program',    type:'aerial_imagery',status:'evaluation',    feeds:7, cost:'paid_800mo', auth:'VEXCEL_API_KEY' },
]

router.get('/registry', (req,res) => {
  const active  = SENSOR_REGISTRY.filter(s=>s.status==='active')
  const keyed   = SENSOR_REGISTRY.filter(s=>s.status==='key_required')
  const planned = SENSOR_REGISTRY.filter(s=>s.status.startsWith('planned'))
  res.json({
    sensors: SENSOR_REGISTRY,
    summary:{ total:SENSOR_REGISTRY.length, active:active.length, keyRequired:keyed.length, planned:planned.length, worldFirsts:SENSOR_REGISTRY.filter(s=>s.worldFirst).length, totalActiveFeeds:active.reduce((a,s)=>a+(s.feeds||0),0) },
    envRequired:[
      { key:'NASA_EARTHDATA_USER', desc:'NASA PACE OCI + TROPOMI backup', register:'urs.earthdata.nasa.gov', required:false },
      { key:'NASA_EARTHDATA_PASS', desc:'NASA Earthdata password',         register:'urs.earthdata.nasa.gov', required:false },
      { key:'COPERNICUS_USER',     desc:'Sentinel-5P TROPOMI methane',     register:'dataspace.copernicus.eu', required:false },
      { key:'COPERNICUS_PASS',     desc:'Copernicus password',             register:'dataspace.copernicus.eu', required:false },
      { key:'AIRNOW_API_KEY',      desc:'Real-time air quality index',     register:'airnowapi.org',           required:false },
      { key:'ANTHROPIC_API_KEY',   desc:'AI Field Assistant (Claude)',     register:'console.anthropic.com',   required:false },
      { key:'VEXCEL_API_KEY',      desc:'7.5cm aerial imagery + DTM',     register:'vexceldata.com/contact',  required:false },
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

export default router

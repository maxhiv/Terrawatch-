import axios from 'axios'

const CMR_BASE = 'https://cmr.earthdata.nasa.gov/search'
const AOI = { west:-88.5, east:-87.5, south:30.0, north:30.9 }
const AOI_STR = `${AOI.west},${AOI.south},${AOI.east},${AOI.north}`

function getAuth() {
  const u = process.env.NASA_EARTHDATA_USER
  const p = process.env.NASA_EARTHDATA_PASS
  if (!u || !p) return null
  return `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`
}

export async function searchPaceGranules(product = 'PACE_OCI_L3M_CHL_NRT', daysBack = 3) {
  const auth = getAuth()
  if (!auth) return {
    available:false, configured:false,
    message:'NASA Earthdata credentials not configured',
    setup:'Register free at urs.earthdata.nasa.gov',
    granules:[]
  }

  const endDate = new Date().toISOString()
  const startDate = new Date(Date.now() - daysBack*86400000).toISOString()

  try {
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      headers:{ Authorization:auth },
      params:{ short_name:product, bounding_box:AOI_STR, temporal:`${startDate},${endDate}`, sort_key:'-start_date', page_size:10 },
      timeout:12000,
    })
    const granules = (data?.feed?.entry||[]).map(g=>({
      id:g.id, title:g.title, time_start:g.time_start, time_end:g.time_end,
      links:(g.links||[]).filter(l=>l.rel?.includes('data')||l.type?.includes('netcdf')).map(l=>l.href),
    }))
    return { available:true, configured:true, product, granules, count:granules.length, aoi:AOI, latestAcquisition:granules[0]?.time_start||null }
  } catch(err) {
    return { available:false, configured:true, error:err.message, product }
  }
}

export async function getPaceStatus() {
  const auth = getAuth()
  return {
    configured:!!auth,
    satellite:'NASA PACE (launched Feb 2024)',
    instrument:'Ocean Color Instrument (OCI)',
    spectralBands:'200+ from 340-890nm at 5nm resolution',
    spatialResolution:'1km at nadir',
    revisit:'Daily global',
    worldFirst:'Species-level HAB attribution — Karenia brevis 588nm peridinin band',
    setupRequired:!auth,
    setupSteps:[
      '1. urs.earthdata.nasa.gov — Create free account',
      '2. Add NASA_EARTHDATA_USER to Replit Secrets',
      '3. Add NASA_EARTHDATA_PASS to Replit Secrets',
      '4. Restart server'
    ]
  }
}

export async function getPaceHabSignal() {
  const paceData = await searchPaceGranules('PACE_OCI_L3M_CHL_NRT', 2)
  return {
    paceAvailable: paceData.available,
    configured: paceData.configured,
    latestAcquisition: paceData.granules?.[0]?.time_start || null,
    horizonExtension:{ current:'72h (in-situ only)', withPace:'8 days (CNN-LSTM datacube, Hill et al. 2021)' },
    kareniaBrevis:{ band:'588nm peridinin', discrimination:'Species-level HAB attribution from orbit', status:'Spectral analysis pending OPeNDAP pixel retrieval' }
  }
}

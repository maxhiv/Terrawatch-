import axios from 'axios'
import { getAllGOESStatus } from './goes.js'

const CMR_BASE   = 'https://cmr.earthdata.nasa.gov/search'
const CDSE_BASE  = 'https://catalogue.dataspace.copernicus.eu/odata/v1'

const MOBILE_BAY_AOI = '-89.0,29.8,-87.3,31.2'
const LAT_MIN = 29.8, LAT_MAX = 31.2
const LON_MIN = -89.0, LON_MAX = -87.3

function getAuth() {
  const user = process.env.NASA_EARTHDATA_USER
  const pass = process.env.NASA_EARTHDATA_PASS
  if (!user || !pass) return null
  return { username: user, password: pass }
}

function getCopernicusAuth() {
  const user = process.env.COPERNICUS_USER
  const pass = process.env.COPERNICUS_PASS
  if (!user || !pass) return null
  return { username: user, password: pass }
}

function daysAgoISO(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
}

export async function getMODISChlorophyll(daysBack = 2) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const temporal = `${daysAgoISO(daysBack)},${daysAgoISO(0)}`
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      params: {
        short_name:   'MODIS_A-JPL-L3m-CHL-NRT',
        bounding_box: MOBILE_BAY_AOI,
        temporal,
        sort_key:     '-start_date',
        page_size:    5,
      },
      auth,
      timeout: 15000,
    })
    const granules = data?.feed?.entry || []
    return {
      available:  true,
      product:    'MODIS Aqua Chlorophyll-a (daily 1km)',
      source:     'NASA Ocean Biology Processing Group',
      granules:   granules.length,
      latest:     granules[0] ? {
        id:      granules[0].id,
        time:    granules[0].time_start,
        title:   granules[0].title,
        links:   (granules[0].links || []).filter(l => l.rel?.includes('data')).slice(0,2).map(l=>l.href),
      } : null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getMODISSst(daysBack = 2) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      params: {
        short_name:   'MODIS_A-JPL-L3m-SST-NRT',
        bounding_box: MOBILE_BAY_AOI,
        temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
        sort_key:     '-start_date',
        page_size:    3,
      },
      auth,
      timeout: 15000,
    })
    const granules = data?.feed?.entry || []
    return {
      available: true,
      product:   'MODIS Aqua SST (daily 1km)',
      granules:  granules.length,
      latest:    granules[0]?.time_start || null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getVIIRSOceanColor(daysBack = 3) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      params: {
        short_name:   'VIIRSN_D3m_CHL',
        bounding_box: MOBILE_BAY_AOI,
        temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
        sort_key:     '-start_date',
        page_size:    5,
      },
      auth,
      timeout: 15000,
    })
    const granules = data?.feed?.entry || []
    return {
      available: true,
      product:   'VIIRS Suomi-NPP Ocean Color / Chlorophyll-a',
      granules:  granules.length,
      latest:    granules[0]?.time_start || null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getVIIRSNighttimeLights(daysBack = 7) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      params: {
        short_name:   'VNP46A1',
        bounding_box: MOBILE_BAY_AOI,
        temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
        sort_key:     '-start_date',
        page_size:    3,
      },
      auth,
      timeout: 15000,
    })
    const granules = data?.feed?.entry || []
    return {
      available: true,
      product:   'VIIRS Black Marble DNB Nighttime Lights (500m daily)',
      note:      'ALAN ecosystem disruption mapping — artificial light at night index for Gulf Coast',
      granules:  granules.length,
      latest:    granules[0]?.time_start || null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getHLSGranules(daysBack = 5) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const [lsResp, s2Resp] = await Promise.allSettled([
      axios.get(`${CMR_BASE}/granules.json`, {
        params: {
          short_name:   'HLSL30',
          bounding_box: MOBILE_BAY_AOI,
          temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
          sort_key:     '-start_date',
          page_size:    5,
        },
        auth, timeout: 15000,
      }),
      axios.get(`${CMR_BASE}/granules.json`, {
        params: {
          short_name:   'HLSS30',
          bounding_box: MOBILE_BAY_AOI,
          temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
          sort_key:     '-start_date',
          page_size:    5,
        },
        auth, timeout: 15000,
      }),
    ])

    const lsGranules = lsResp.status === 'fulfilled' ? lsResp.value.data?.feed?.entry || [] : []
    const s2Granules = s2Resp.status === 'fulfilled' ? s2Resp.value.data?.feed?.entry || [] : []

    return {
      available: true,
      product:   'NASA HLS — Harmonized Landsat + Sentinel-2 (30m ~2-3 day revisit)',
      note:      'Best free high-revisit multispectral for HAB Oracle vegetation stress and bloom monitoring',
      HLSL30:    { granules: lsGranules.length, latest: lsGranules[0]?.time_start },
      HLSS30:    { granules: s2Granules.length, latest: s2Granules[0]?.time_start },
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getLandsatGranules(daysBack = 16) {
  const auth = getAuth()
  if (!auth) return { available: false, reason: 'NASA_EARTHDATA_USER + PASS not configured' }

  try {
    const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
      params: {
        short_name:   'LANDSAT_OT_C2_L2',
        bounding_box: MOBILE_BAY_AOI,
        temporal:     `${daysAgoISO(daysBack)},${daysAgoISO(0)}`,
        sort_key:     '-start_date',
        page_size:    5,
      },
      auth,
      timeout: 15000,
    })
    const granules = data?.feed?.entry || []
    return {
      available: true,
      product:   'Landsat Collection 2 Level-2 (30m, 11 bands + thermal)',
      note:      'Long-term land use change, LULC for nonpoint source model, thermal discharge monitoring',
      granules:  granules.length,
      latest:    granules[0] ? {
        id:    granules[0].id,
        time:  granules[0].time_start,
        title: granules[0].title,
      } : null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getSentinel2Granules(daysBack = 5, maxCloudPct = 80) {
  const auth = getCopernicusAuth()
  if (!auth) return { available: false, reason: 'COPERNICUS_USER + PASS not configured' }

  try {
    const dateFrom = daysAgoISO(daysBack)
    const dateNow  = daysAgoISO(0)
    const filter = [
      `Collection/Name eq 'SENTINEL-2'`,
      `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'S2MSI2A')`,
      `ContentDate/Start gt ${dateFrom}T00:00:00.000Z`,
      `ContentDate/Start lt ${dateNow}T23:59:59.000Z`,
      `Attributes/OData.CSC.DoubleAttribute/any(att:att/Name eq 'cloudCover' and att/OData.CSC.DoubleAttribute/Value le ${maxCloudPct})`,
      `OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((${LON_MIN} ${LAT_MIN},${LON_MAX} ${LAT_MIN},${LON_MAX} ${LAT_MAX},${LON_MIN} ${LAT_MAX},${LON_MIN} ${LAT_MIN}))')`,
    ].join(' and ')

    const { data } = await axios.get(`${CDSE_BASE}/Products`, {
      params: { $filter: filter, $top: 10, $orderby: 'ContentDate/Start desc' },
      auth,
      timeout: 15000,
    })
    const products = data?.value || []
    return {
      available:   true,
      product:     'Sentinel-2 Level-2A (10m, 13 bands)',
      note:        'HAB bloom surface expression, turbidity, NDVI vegetation stress, water color',
      granules:    products.length,
      latest: products[0] ? {
        id:        products[0].Id,
        name:      products[0].Name,
        date:      products[0].ContentDate?.Start,
        cloudPct:  products[0].Attributes?.find(a => a.Name === 'cloudCover')?.Value,
        size_mb:   products[0].ContentLength ? Math.round(products[0].ContentLength / 1048576) : null,
      } : null,
    }
  } catch(err) {
    return { available: false, reason: err.message }
  }
}

export async function getCopernicusDEMStatus() {
  const tilePaths = [
    'COP-DEM_GLO-30-DGED__2023_1/Copernicus_DSM_COG_10_N30_00_W088_00_DEM/DEM',
    'COP-DEM_GLO-30-DGED__2023_1/Copernicus_DSM_COG_10_N30_00_W089_00_DEM/DEM',
    'COP-DEM_GLO-30-DGED__2023_1/Copernicus_DSM_COG_10_N31_00_W088_00_DEM/DEM',
  ]
  return {
    available:   true,
    product:     'Copernicus DEM GLO-30 (30m global)',
    note:        'WetlandAI hydrology layer, watershed flow routing, sea level rise scenarios',
    downloadUrl: 'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/copernicus-dem',
    tiles:       tilePaths,
    auth:        'No authentication required for GLO-30 public release',
    format:      'GeoTIFF Cloud-Optimized (COG)',
  }
}

export async function getAllSatelliteStatus() {
  const [modis, viirs, hls, landsat, s2, dem, goes] = await Promise.allSettled([
    getMODISChlorophyll(3),
    getVIIRSOceanColor(3),
    getHLSGranules(7),
    getLandsatGranules(16),
    getSentinel2Granules(7),
    getCopernicusDEMStatus(),
    getAllGOESStatus(),
  ])

  return {
    modis:     modis.status     === 'fulfilled' ? modis.value     : { available: false },
    viirs:     viirs.status     === 'fulfilled' ? viirs.value     : { available: false },
    hls:       hls.status       === 'fulfilled' ? hls.value       : { available: false },
    landsat:   landsat.status   === 'fulfilled' ? landsat.value   : { available: false },
    sentinel2: s2.status        === 'fulfilled' ? s2.value        : { available: false },
    dem:       dem.status       === 'fulfilled' ? dem.value       : { available: false },
    goes:      goes.status      === 'fulfilled' ? goes.value      : { status: { available: false }, imagery: { available: false } },
    totalSources: 7,
  }
}

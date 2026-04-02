import axios from 'axios'

const CMEMS_STAC   = 'https://stac.marine.copernicus.eu/metadata'
const HYCOM_BASE   = 'https://ncss.hycom.org/thredds/ncss'
const CW_ERDDAP    = 'https://coastwatch.pfeg.noaa.gov/erddap'
const STREAMSTATS  = 'https://streamstats.usgs.gov/streamstatsservices'
const DCATS_BASE   = 'https://coast.noaa.gov/dataservices/api'

const MOB_CENTER_LAT = 30.5
const MOB_CENTER_LON = -88.0
const LAT_MIN = 29.8, LAT_MAX = 31.2
const LON_MIN = -89.0, LON_MAX = -87.3

function getCopernicusAuth() {
  const user = process.env.COPERNICUS_USER
  const pass = process.env.COPERNICUS_PASS
  return (user && pass) ? { username: user, password: pass } : null
}

export async function getCMEMSOceanPhysics() {
  const auth = getCopernicusAuth()
  if (!auth) return { available: false, reason: 'COPERNICUS_USER + PASS not configured' }

  try {
    const { data } = await axios.get(`${CMEMS_STAC}/GLOBAL_ANALYSISFORECAST_PHY_001_024/catalog.json`, {
      timeout: 12000,
    })
    return {
      available: true,
      product:   'CMEMS Global Ocean Physics (daily)',
      variables: ['temperature', 'salinity', 'u_current', 'v_current', 'sea_level'],
      resolution: '1/12° (~9km) global, hourly surface + 3D profiles',
      note:       'Gulf dead zone bottom-water oxygen forecasting. Cross-media ocean boundary conditions.',
      dataAccess: 'motuclient Python library or Copernicus Marine Toolbox with COPERNICUS_USER/PASS',
      productId:  'GLOBAL_ANALYSISFORECAST_PHY_001_024',
      catalogUrl: `${CMEMS_STAC}/GLOBAL_ANALYSISFORECAST_PHY_001_024/catalog.json`,
    }
  } catch(err) {
    return {
      available:  getCopernicusAuth() !== null,
      product:    'CMEMS Copernicus Marine Service',
      note:       'Credentials configured. Access via: pip install copernicusmarine',
      reason:     err.message,
    }
  }
}

export async function getCMEMSBiogeochemistry() {
  const auth = getCopernicusAuth()
  if (!auth) return { available: false, reason: 'COPERNICUS_USER + PASS not configured' }

  return {
    available:  true,
    product:    'CMEMS Global Ocean Biogeochemistry (daily)',
    variables:  ['dissolved_oxygen', 'nitrate', 'phosphate', 'chlorophyll', 'phytoplankton'],
    resolution: '1/4° daily',
    note:       'Bottom-water dissolved oxygen model for Gulf of Mexico dead zone dynamics',
    productId:  'GLOBAL_ANALYSISFORECAST_BGC_001_028',
  }
}

export async function getHYCOMSurfaceConditions() {
  try {
    const { data } = await axios.get(`${HYCOM_BASE}/GLBy0.08/expt_93.0/ssh/best.ncd`, {
      params: {
        var:          'surf_el',
        north:        31.2,
        west:         -89.0,
        east:         -87.3,
        south:        29.8,
        horizStride:  1,
        vertCoord:    '',
        accept:       'application/json',
        time_start:   new Date(Date.now() - 86400000).toISOString().split('.')[0],
        time_end:     new Date().toISOString().split('.')[0],
      },
      timeout: 15000,
    })
    return {
      available: true,
      product:   'HYCOM Global 1/12° Ocean Model',
      note:      'Saltwater intrusion advance warning coastal boundary + bloom transport routing',
      data,
    }
  } catch(err) {
    return {
      available:   false,
      product:     'HYCOM Global 1/12° (OPeNDAP)',
      baseUrl:     HYCOM_BASE,
      note:        'HYCOM can be slow (~15-30s). Use for saltwater intrusion coastal boundary conditions.',
      error:       err.message,
    }
  }
}

export async function getCoastWatchChlA(daysBack = 2) {
  try {
    const start = new Date(Date.now() - daysBack * 86400000)
    const url = `${CW_ERDDAP}/griddap/erdMH1chla8day.json`
    const { data } = await axios.get(url, {
      params: {
        latitude:  `[(${LAT_MIN}):(${LAT_MAX})]`,
        longitude: `[(${LON_MIN}):(${LON_MAX})]`,
        time:      `[(${start.toISOString().split('.')[0]}Z)]`,
      },
      timeout: 15000,
    })
    return {
      available: true,
      product:   'CoastWatch ERDDAP — MODIS Aqua Chlorophyll-a (4km 8-day composite)',
      source:    'coastwatch.pfeg.noaa.gov/erddap',
      data,
    }
  } catch(err) {
    return {
      available:  false,
      product:    'NOAA CoastWatch ERDDAP',
      baseUrl:    CW_ERDDAP,
      datasets: {
        'erdMH1chla8day': 'MODIS Aqua CHL-a 8-day 4km',
        'erdMH1sstd8day': 'MODIS Aqua SST 8-day 4km',
        'ucsdHfrE6':      'US East/Gulf HF Radar surface currents',
      },
      note:   'Gulf HAB surface chlorophyll monitoring layer',
      error:  err.message,
    }
  }
}

export async function queryERDDAP(erddapBase, datasetId, params = {}) {
  try {
    const { data } = await axios.get(`${erddapBase}/griddap/${datasetId}.json`, {
      params,
      timeout: 15000,
    })
    return { available: true, datasetId, data }
  } catch(err) {
    try {
      const { data } = await axios.get(`${erddapBase}/tabledap/${datasetId}.json`, {
        params,
        timeout: 15000,
      })
      return { available: true, datasetId, data }
    } catch(err2) {
      return { available: false, datasetId, error: err2.message }
    }
  }
}

export async function getStreamStats(lat, lon, rcode = 'AL') {
  try {
    const { data } = await axios.get(`${STREAMSTATS}/watershed.geojson`, {
      params: {
        rcode,
        xlocation: lon,
        ylocation: lat,
        crs:       4326,
        includeparameters: false,
        includeflowtypes:  false,
        includegeometry:   true,
      },
      timeout: 30000,
    })
    return {
      available:    true,
      product:      'USGS StreamStats Watershed Delineation',
      pourPoint:    { lat, lon },
      watershed:    data,
    }
  } catch(err) {
    return { available: false, product: 'USGS StreamStats', error: err.message }
  }
}

export async function getFlowStatistics(workspaceId, rcode = 'AL') {
  try {
    const { data } = await axios.get(`${STREAMSTATS}/flowstatistics.json`, {
      params: { rcode, workspaceID: workspaceId, statisticsgroup: 'PK' },
      timeout: 20000,
    })
    return { available: true, statistics: data }
  } catch(err) {
    return { available: false, error: err.message }
  }
}

export async function getDigitalCoastDatasets(bbox = '-89.0,29.8,-87.3,31.2') {
  try {
    const { data } = await axios.get(`${DCATS_BASE}/datasets`, {
      params: {
        f:    'json',
        bbox,
        type: 'lidar,elevation,shoreline',
      },
      timeout: 12000,
    })
    return {
      available: true,
      product:   'NOAA Digital Coast Data Catalog',
      note:      'Coastal lidar, shoreline change detection, sea level rise scenarios',
      datasets:  data?.features?.length || 0,
      data,
    }
  } catch(err) {
    return {
      available:   false,
      product:     'NOAA Digital Coast',
      note:        'Shoreline change detection supplement. Sea level rise scenarios for saltwater intrusion model.',
      accessUrl:   'https://coast.noaa.gov/dataviewer/',
      apiEndpoint: DCATS_BASE,
      error:       err.message,
    }
  }
}

export function extractHYCOMScalars(hycomData) {
  if (!hycomData?.available) return {}
  const d = hycomData.data || hycomData
  return {
    hycom_ssh_m: d.ssh ?? null,
    hycom_sst_c: d.sst ?? d.water_temp ?? null,
    hycom_salinity_psu: d.salinity ?? null,
    hycom_current_u: d.u_current ?? null,
    hycom_current_v: d.v_current ?? null,
  }
}

export function extractCoastWatchScalars(cwData) {
  if (!cwData?.available) return {}
  return {
    coastwatch_chl_ug_l: cwData.chlorophyll_mean ?? null,
    coastwatch_chl_max: cwData.chlorophyll_max ?? null,
    coastwatch_pixels: cwData.validPixels ?? null,
  }
}

export async function getAllOceanStatus() {
  const [cmems, hycom, coastwatch, digitalcoast] = await Promise.allSettled([
    getCMEMSOceanPhysics(),
    getHYCOMSurfaceConditions(),
    getCoastWatchChlA(),
    getDigitalCoastDatasets(),
  ])

  return {
    cmems:        cmems.status      === 'fulfilled' ? cmems.value      : { available: false },
    hycom:        hycom.status      === 'fulfilled' ? hycom.value      : { available: false },
    coastwatch:   coastwatch.status === 'fulfilled' ? coastwatch.value : { available: false },
    streamstats:  { available: true, product: 'USGS StreamStats', note: 'On-demand watershed delineation by coordinate — call /api/sensors/ocean/streamstats?lat=X&lon=Y', onDemand: true },
    digitalcoast: digitalcoast.status === 'fulfilled' ? digitalcoast.value : { available: false },
    totalSources: 5,
  }
}

import axios from 'axios'

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const OPENEO_BASE = 'https://openeo.dataspace.copernicus.eu/openeo/1.2'

const MOBILE_BAY_SPATIAL = {
  west: -88.8, south: 30.0, east: -87.5, north: 31.2
}

let _tokenCache = { token: null, expires: 0 }

async function getToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expires - 30000) {
    return _tokenCache.token
  }

  const user = process.env.COPERNICUS_USER
  const pass = process.env.COPERNICUS_PASS

  if (!user || !pass) return null

  try {
    const { data } = await axios.post(TOKEN_URL,
      new URLSearchParams({
        client_id: 'cdse-public',
        username: user,
        password: pass,
        grant_type: 'password',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    )

    _tokenCache = { token: data.access_token, expires: Date.now() + data.expires_in * 1000 }
    return data.access_token
  } catch (err) {
    console.error('[openEO Auth]', err.response?.data?.error || err.message)
    return null
  }
}

async function openeoGet(path) {
  const token = await getToken()
  if (!token) return { available: false, configured: false, message: 'COPERNICUS_USER + COPERNICUS_PASS required' }
  const { data } = await axios.get(`${OPENEO_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 12000
  })
  return data
}

async function openeoPost(path, body) {
  const token = await getToken()
  if (!token) return { available: false, configured: false }
  const { data } = await axios.post(`${OPENEO_BASE}${path}`, body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 30000
  })
  return data
}

export const ALGORITHM_CATALOG = [
  {
    id: 'BIOPAR', name: 'BIOPAR — Biophysical Parameters', provider: 'VITO',
    inputs: 'Sentinel-2 L2A', outputs: ['LAI', 'FAPAR', 'FCOVER', 'NDVI'],
    resolution: '10m', revisit: 'Every 5 days',
    terrawatch: { primary: 'Blue Carbon MRV — LAI for biomass estimation.', priority: 'HIGH', readyToActivate: true },
    openeoNamespace: 'vito', openeoProcess: 'biopar',
  },
  {
    id: 'CropSAR_2D', name: 'CropSAR 2D — Cloud-Free Time Series', provider: 'VITO',
    inputs: 'Sentinel-1 SAR + Sentinel-2 optical', outputs: ['Cloud-free NDVI time series'],
    resolution: '10m', revisit: 'Daily (SAR cloud-penetrating)',
    terrawatch: { primary: 'SOLVES GULF COAST SUMMER CLOUD PROBLEM.', priority: 'CRITICAL', readyToActivate: true },
    openeoNamespace: 'vito', openeoProcess: 'cropsar',
  },
  {
    id: 'EVI', name: 'EVI — Enhanced Vegetation Index', provider: 'VITO',
    inputs: 'Sentinel-2 L2A', outputs: ['EVI values at 10m'],
    resolution: '10m', revisit: 'Every 5 days',
    terrawatch: { primary: 'Saltwater intrusion early detection.', priority: 'HIGH', readyToActivate: true },
    openeoNamespace: 'vito', openeoProcess: 'evi',
  },
  {
    id: 'MSI', name: 'MSI — Moisture Stress Index', provider: 'VITO',
    inputs: 'Sentinel-2 L2A', outputs: ['MSI values'],
    resolution: '20m', revisit: 'Every 5 days',
    terrawatch: { primary: 'Saltwater intrusion advance warning at 20m.', priority: 'HIGH', readyToActivate: true },
    openeoNamespace: 'vito', openeoProcess: 'msi',
  },
  {
    id: 'MOGPR', name: 'MOGPR — Gap-Filled Time Series', provider: 'AI4FOOD',
    inputs: 'Sentinel-2 time series', outputs: ['Gap-filled vegetation indices'],
    resolution: '10m', revisit: 'Daily reconstructed',
    terrawatch: { primary: 'HAB Oracle input gap-filling.', priority: 'HIGH', readyToActivate: true },
    openeoNamespace: 'ai4food', openeoProcess: 'mogpr',
  },
  {
    id: 'MOGPR_S1', name: 'MOGPR S1 — SAR-Informed Gap-Fill', provider: 'AI4FOOD',
    inputs: 'Sentinel-1 + Sentinel-2', outputs: ['SAR-constrained gap-filled time series'],
    resolution: '10m', revisit: 'Daily reconstructed',
    terrawatch: { primary: 'SAR-constrained gap-filling with uncertainty.', priority: 'HIGH', readyToActivate: true },
    openeoNamespace: 'ai4food', openeoProcess: 'mogpr_s1',
  },
  {
    id: 'WorldCereal', name: 'WorldCereal — Crop Type', provider: 'ESA',
    inputs: 'Sentinel-1+2 time series', outputs: ['10m crop type map'],
    resolution: '10m', revisit: 'Annual',
    terrawatch: { primary: 'CAFO watershed attribution improvement.', priority: 'MEDIUM', readyToActivate: true },
    openeoNamespace: 'worldcereal', openeoProcess: 'worldcereal_classification',
  },
  {
    id: 'NBR', name: 'NBR — Normalized Burn Ratio', provider: 'VITO',
    inputs: 'Sentinel-2 L2A', outputs: ['NBR values'],
    resolution: '20m', revisit: 'Every 5 days',
    terrawatch: { primary: 'Post-hurricane watershed damage assessment.', priority: 'MEDIUM', readyToActivate: true },
    openeoNamespace: 'vito', openeoProcess: 'nbr',
  },
]

export async function getOpenEOStatus() {
  const token = await getToken()
  const configured = !!token

  let credits = null
  if (configured) {
    try { const me = await openeoGet('/me'); credits = me?.budget ?? null } catch (credErr) { /* credits are optional */ }
  }

  return {
    configured,
    platform: 'Copernicus Data Space Ecosystem — openEO Algorithm Plaza',
    endpoint: OPENEO_BASE,
    authUsing: 'COPERNICUS_USER + COPERNICUS_PASS',
    freeTier: '~1000 credits/month',
    credits,
    algorithms: ALGORITHM_CATALOG,
    setupRequired: !configured,
    setupSteps: !configured ? [
      '1. Register at dataspace.copernicus.eu',
      '2. Add COPERNICUS_USER to Replit Secrets',
      '3. Add COPERNICUS_PASS to Replit Secrets',
      '4. Restart server',
    ] : [],
  }
}

export async function getBIOPAR(daysBack = 15) {
  const token = await getToken()
  if (!token) return { available: false, configured: false, algorithm: 'BIOPAR' }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]

  try {
    await openeoPost('/result', {
      process_graph: {
        load_s2: {
          process_id: 'load_collection',
          arguments: { id: 'SENTINEL2_L2A', spatial_extent: MOBILE_BAY_SPATIAL, temporal_extent: [startDate, endDate], bands: ['B03', 'B04', 'B08', 'B11'] },
        },
        biopar: {
          process_id: 'biopar', namespace: 'vito',
          arguments: { data: { from_node: 'load_s2' }, type: 'LAI' },
          result: true,
        },
      },
    })
    return { available: true, configured: true, algorithm: 'BIOPAR', parameter: 'LAI', period: `${startDate} to ${endDate}` }
  } catch (err) {
    return { available: false, configured: true, algorithm: 'BIOPAR', error: err.response?.data?.message || err.message }
  }
}

export async function getEVI(daysBack = 10) {
  const token = await getToken()
  if (!token) return { available: false, configured: false, algorithm: 'EVI' }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]

  try {
    await openeoPost('/result', {
      process_graph: {
        load: { process_id: 'load_collection', arguments: { id: 'SENTINEL2_L2A', spatial_extent: MOBILE_BAY_SPATIAL, temporal_extent: [startDate, endDate], bands: ['B02', 'B04', 'B08'] } },
        evi: { process_id: 'evi', namespace: 'vito', arguments: { data: { from_node: 'load' } }, result: true },
      },
    })
    return { available: true, configured: true, algorithm: 'EVI', period: `${startDate} to ${endDate}` }
  } catch (err) {
    return { available: false, configured: true, algorithm: 'EVI', error: err.response?.data?.message || err.message }
  }
}

export async function getMSI(daysBack = 10) {
  const token = await getToken()
  if (!token) return { available: false, configured: false, algorithm: 'MSI' }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]

  try {
    await openeoPost('/result', {
      process_graph: {
        load: { process_id: 'load_collection', arguments: { id: 'SENTINEL2_L2A', spatial_extent: MOBILE_BAY_SPATIAL, temporal_extent: [startDate, endDate], bands: ['B8A', 'B11'] } },
        msi: { process_id: 'msi', namespace: 'vito', arguments: { data: { from_node: 'load' } }, result: true },
      },
    })
    return { available: true, configured: true, algorithm: 'MSI', period: `${startDate} to ${endDate}` }
  } catch (err) {
    return { available: false, configured: true, algorithm: 'MSI', error: err.response?.data?.message || err.message }
  }
}

export async function getCropSARStatus() {
  const token = await getToken()
  return {
    configured: !!token, algorithm: 'CropSAR 2D',
    impact: 'CRITICAL — Solves Gulf Coast summer cloud blindness',
    batchJob: true,
    note: 'CropSAR is a batch job — takes 15-30 min per AOI. Schedule nightly via cron.',
  }
}

export async function getMOGPRStatus() {
  const token = await getToken()
  return {
    configured: !!token, algorithm: 'MOGPR + MOGPR S1',
    impact: 'HIGH — Physically consistent gap-filling with uncertainty bounds',
    uncertaintyBounds: true,
  }
}

export async function getWorldCerealStatus() {
  const token = await getToken()
  return {
    configured: !!token, algorithm: 'WorldCereal',
    impact: 'MEDIUM — Improves CAFO nutrient loading attribution',
    updateFrequency: 'Annual',
  }
}

export async function getAllOpenEOStatus() {
  const [status, cropsar, mogpr, worldcereal] = await Promise.all([
    getOpenEOStatus(), getCropSARStatus(), getMOGPRStatus(), getWorldCerealStatus(),
  ])

  return {
    platform: status,
    algorithms: {
      criticalReady: ['CropSAR 2D', 'BIOPAR', 'EVI', 'MSI', 'MOGPR S1'],
      mediumReady: ['WorldCereal', 'NBR'],
      cropsar, mogpr, worldcereal,
    },
    nextSteps: status.configured ? [
      'Run getEVI() → validate saltwater intrusion mapping',
      'Submit CropSAR batch job → cloud-free NDVI time series',
      'Run BIOPAR → get LAI for blue carbon pilot',
    ] : [
      'Add COPERNICUS_USER + COPERNICUS_PASS to Replit Secrets',
    ],
  }
}

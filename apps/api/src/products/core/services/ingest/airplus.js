import axios from 'axios'

const AQS_BASE       = 'https://aqs.epa.gov/data/api'
const OPENAQ_BASE    = 'https://api.openaq.org/v3'
const PURPLEAIR_BASE = 'https://api.purpleair.com/v1'

const MOB_LAT = 30.5, MOB_LON = -88.0

export async function getAQSCurrentData(parameterCode = '88101') {
  const email = process.env.AQS_EMAIL
  const key   = process.env.AQS_API_KEY

  if (!email || !key) {
    return {
      available:   false,
      reason:      'AQS_EMAIL and AQS_API_KEY not configured',
      registerAt:  'https://aqs.epa.gov/data/api/signup?email=YOUR_EMAIL',
      note:        'Submit GET to that URL with your email — key delivered instantly',
      addToReplit: 'Add AQS_EMAIL and AQS_API_KEY to Replit Secrets',
      parameters: {
        '88101': 'PM2.5',
        '44201': 'Ozone',
        '42101': 'CO',
        '42401': 'SO2',
        '42602': 'NO2',
        '42603': 'NOx',
      },
    }
  }

  try {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const { data } = await axios.get(`${AQS_BASE}/dailyData/byCounty`, {
      params: {
        email,
        key,
        param:   parameterCode,
        bdate:   today,
        edate:   today,
        state:   '01',
        county:  '097',
      },
      timeout: 20000,
    })
    return {
      available:   true,
      product:     'EPA AQS Official Monitor Network',
      parameter:   parameterCode,
      note:        'Cross-media atmospheric N deposition. CAFO ammonia source data.',
      records:     data?.Data?.length || 0,
      readings:    (data?.Data || []).map(d => ({
        site:        d.site_number,
        poc:         d.poc,
        parameter:   d.parameter,
        value:       d.arithmetic_mean,
        units:       d.units_of_measure,
        method:      d.method_name,
        date:        d.date_local,
        lat:         d.latitude,
        lon:         d.longitude,
      })),
    }
  } catch(err) {
    return { available: false, product: 'EPA AQS', error: err.message }
  }
}

export async function getAQSMonitorSites() {
  const email = process.env.AQS_EMAIL
  const key   = process.env.AQS_API_KEY
  if (!email || !key) return { available: false, reason: 'AQS_EMAIL + AQS_API_KEY not configured' }

  try {
    const { data } = await axios.get(`${AQS_BASE}/monitors/byCounty`, {
      params: { email, key, param: '88101', bdate: '20240101', edate: '20240101', state: '01', county: '003' },
      timeout: 15000,
    })
    return {
      available:  true,
      product:    'EPA AQS Monitor Sites — Baldwin County',
      monitors:   data?.Data?.length || 0,
      sites:      data?.Data?.map(m => ({ site: m.site_number, name: m.local_site_name, lat: m.latitude, lon: m.longitude })) || [],
    }
  } catch(err) {
    return { available: false, error: err.message }
  }
}

export async function getOpenAQReadings(lat = MOB_LAT, lon = MOB_LON, radiusMeters = 50000) {
  try {
    const { data } = await axios.get(`${OPENAQ_BASE}/locations`, {
      params: {
        coordinates: `${lat},${lon}`,
        radius:      radiusMeters,
        limit:       20,
        order_by:    'lastUpdated',
        sort:        'desc',
      },
      timeout: 12000,
    })
    const locations = data?.results || []
    return {
      available:  true,
      product:    'OpenAQ Global Air Quality Aggregator',
      note:       'Community air quality gap-fill. Hyperlocal coverage between EPA monitors.',
      locationCount: locations.length,
      locations:  locations.map(l => ({
        id:           l.id,
        name:         l.name,
        lat:          l.coordinates?.latitude,
        lon:          l.coordinates?.longitude,
        parameters:   l.parameters?.map(p => p.parameter),
        lastUpdated:  l.lastUpdated,
      })),
    }
  } catch(err) {
    return {
      available:    false,
      product:      'OpenAQ',
      note:         'No API key required. Free for non-commercial use.',
      apiUrl:       OPENAQ_BASE,
      error:        err.message,
    }
  }
}

export async function getOpenAQLatest(lat = MOB_LAT, lon = MOB_LON) {
  try {
    const { data } = await axios.get(`${OPENAQ_BASE}/measurements`, {
      params: {
        coordinates: `${lat},${lon}`,
        radius:      50000,
        limit:       50,
        parameter:   'pm25',
        order_by:    'datetime',
        sort:        'desc',
      },
      timeout: 12000,
    })
    return {
      available:  true,
      product:    'OpenAQ PM2.5 Readings',
      count:      data?.results?.length || 0,
      readings:   (data?.results || []).slice(0, 10).map(r => ({
        location: r.location,
        value:    r.value,
        units:    r.unit,
        time:     r.date?.utc,
        lat:      r.coordinates?.latitude,
        lon:      r.coordinates?.longitude,
      })),
    }
  } catch(err) {
    return { available: false, product: 'OpenAQ', error: err.message }
  }
}

export async function getPurpleAirReadings() {
  const key = process.env.PURPLEAIR_API_KEY

  if (!key) {
    return {
      available:   false,
      reason:      'PURPLEAIR_API_KEY not configured',
      registerAt:  'https://develop.purpleair.com/sign-in (free API key)',
      addToReplit: 'Add PURPLEAIR_API_KEY to Replit Secrets',
      note:        'Community PM2.5 layer — hyperlocal coverage, industrial fence-line detection',
    }
  }

  try {
    const { data } = await axios.get(`${PURPLEAIR_BASE}/sensors`, {
      params: {
        nwlng:  -89.0,
        nwlat:   31.2,
        selng:  -87.3,
        selat:   29.8,
        fields: 'name,pm2.5,pm2.5_cf_1,humidity,temperature,latitude,longitude,last_seen',
      },
      headers: { 'X-API-Key': key },
      timeout: 12000,
    })
    const sensors = data?.data || []
    const fields  = data?.fields || []
    const fieldIdx = Object.fromEntries(fields.map((f, i) => [f, i]))

    return {
      available:    true,
      product:      'PurpleAir Hyperlocal PM2.5 Network',
      note:         'Community air quality layer. Fence-line industrial pollution not captured by AQS.',
      sensorCount:  sensors.length,
      sensors:      sensors.slice(0, 20).map(s => ({
        name:     s[fieldIdx['name']],
        pm25:     s[fieldIdx['pm2.5']],
        humidity: s[fieldIdx['humidity']],
        temp_f:   s[fieldIdx['temperature']],
        lat:      s[fieldIdx['latitude']],
        lon:      s[fieldIdx['longitude']],
        lastSeen: s[fieldIdx['last_seen']],
      })),
    }
  } catch(err) {
    return { available: false, product: 'PurpleAir', error: err.message }
  }
}

export async function getAllAirQualityStatus() {
  const [aqs, openaqMeta, openaqLatest, purpleair] = await Promise.allSettled([
    getAQSCurrentData(),
    getOpenAQReadings(),
    getOpenAQLatest(),
    getPurpleAirReadings(),
  ])

  const oqMeta = openaqMeta.status === 'fulfilled' ? openaqMeta.value : { available: false }
  const oqLatest = openaqLatest.status === 'fulfilled' ? openaqLatest.value : {}
  const oqReadings = oqLatest.readings || []
  const oqAvgPM25 = oqReadings.length > 0
    ? oqReadings.reduce((s,r) => s + (r.value||0), 0) / oqReadings.length
    : null
  const openAQResult = {
    ...oqMeta,
    available: oqMeta.available || oqLatest.available || false,
    readings: oqReadings,
    avgPM25: oqAvgPM25,
  }

  const pa = purpleair.status === 'fulfilled' ? purpleair.value : { available: false }
  const paSensors = pa.sensors || []
  const paVals = paSensors.map(s => s.pm25).filter(v => v != null && !isNaN(v))
  const paAvgPM25 = paVals.length > 0 ? paVals.reduce((s,v) => s+v, 0) / paVals.length : null
  const purpleAirResult = { ...pa, avgPM25: paAvgPM25 }

  const aqsResult = aqs.status === 'fulfilled' ? aqs.value : { available: false }
  const aqsReadings = aqsResult.readings || []
  const aqsAvgVal = aqsReadings.length > 0
    ? aqsReadings.reduce((s,r) => s + (r.value||0), 0) / aqsReadings.length
    : null
  aqsResult.avgValue = aqsAvgVal

  return {
    epaAQS:    { ...aqsResult, configured: !!(process.env.AQS_EMAIL && process.env.AQS_API_KEY) },
    openAQ:    openAQResult,
    purpleAir: { ...purpleAirResult, configured: !!process.env.PURPLEAIR_API_KEY },
    totalSources: 3,
  }
}

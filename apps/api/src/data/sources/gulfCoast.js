import axios from 'axios'

const NDBC_BASE = 'https://www.ndbc.noaa.gov'

const GCOOS_BUOYS = [
  { id: '42012', name: 'Orange Beach, AL',    position: { lat: 30.065, lon: -87.552 } },
  { id: '42039', name: 'Gulf Shores, AL',     position: { lat: 28.787, lon: -86.006 } },
  { id: 'DPIA1', name: 'Dauphin Island',      position: { lat: 30.250, lon: -88.075 } },
  { id: 'MBPA1', name: 'Middle Bay Platform', position: { lat: 30.432, lon: -88.001 } },
]

function parseNDBCData(text) {
  const lines = text.trim().split('\n').filter(l => !l.startsWith('#'))
  if (!lines.length) return { timestamp: null, readings: {} }

  const parts = lines[0].trim().split(/\s+/)
  const [yr, mo, dd, hh, mm, wdir, wspd, gst, wvht, dpd, apd, mwd, pres, atmp, wtmp] = parts

  const safeFloat = v => {
    const n = parseFloat(v)
    return (isNaN(n) || n === 99 || n === 999 || n === 9999) ? null : n
  }

  const timestamp = yr ? `20${yr}-${mo}-${dd}T${hh}:${mm}:00Z` : null

  return {
    timestamp,
    readings: {
      wind_dir:    { value: safeFloat(wdir), unit: '°',    label: 'Wind Direction' },
      wind_speed:  { value: safeFloat(wspd), unit: 'm/s',  label: 'Wind Speed' },
      wind_gust:   { value: safeFloat(gst),  unit: 'm/s',  label: 'Wind Gust' },
      wave_height: { value: safeFloat(wvht), unit: 'm',    label: 'Wave Height' },
      wave_period: { value: safeFloat(dpd),  unit: 's',    label: 'Dominant Wave Period' },
      pressure:    { value: safeFloat(pres), unit: 'hPa',  label: 'Barometric Pressure' },
      air_temp:    { value: safeFloat(atmp), unit: '°C',   label: 'Air Temperature' },
      water_temp:  { value: safeFloat(wtmp), unit: '°C',   label: 'Water Temperature' },
    },
  }
}

function computeBuoyFlags(readings) {
  const flags = []
  const wt = readings.water_temp?.value
  const ws = readings.wind_speed?.value
  if (wt && wt > 28) flags.push('WARM_GULF_WATER')
  if (ws && ws > 10) flags.push('HIGH_WIND')
  if (ws && ws < 3)  flags.push('CALM_CONDITIONS')
  return flags
}

export async function fetchGCOOSBuoys() {
  const results = []

  for (const buoy of GCOOS_BUOYS) {
    try {
      const { data: text } = await axios.get(`${NDBC_BASE}/data/realtime2/${buoy.id}.txt`, {
        headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)' },
        timeout: 10000,
        responseType: 'text',
      })

      const parsed = parseNDBCData(text)

      results.push({
        source:    'ndbc_gcoos',
        buoy_id:   buoy.id,
        name:      buoy.name,
        position:  buoy.position,
        timestamp: parsed.timestamp,
        readings:  parsed.readings,
        flags:     computeBuoyFlags(parsed.readings),
      })

    } catch (err) {
      results.push({ ...buoy, source: 'ndbc_gcoos', error: err.message })
    }
  }

  return results
}

export async function fetchNOAAHABBulletin() {
  const result = {
    source:    'noaa_hab_bulletin',
    region:    'Gulf of Mexico',
    timestamp: new Date().toISOString(),
    bulletin:  null,
    flags:     [],
    error:     null,
  }

  try {
    const { data: json } = await axios.get(
      'https://coastalscience.noaa.gov/habsos/download.aspx?format=json&region=GOM&ndays=30',
      {
        headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)' },
        timeout: 20000,
      }
    )

    const features = json.features ?? []

    const nearBay = features.filter(f => {
      const [lon, lat] = f.geometry?.coordinates ?? []
      return lat >= 29 && lat <= 32 && lon >= -90 && lon <= -87
    })

    result.bulletin = {
      total_observations: features.length,
      near_mobile_bay:    nearBay.length,
      recent_events:      nearBay.slice(0, 10).map(f => ({
        lat:      f.geometry.coordinates[1],
        lon:      f.geometry.coordinates[0],
        species:  f.properties?.GENUS,
        category: f.properties?.CATEGORY,
        date:     f.properties?.SAMPLE_DATE,
        cell_conc: f.properties?.CELLCONC,
      })),
    }

    if (nearBay.length > 0) result.flags.push('ACTIVE_HAB_EVENTS_NEARBY')
    if (nearBay.length > 5) result.flags.push('ELEVATED_HAB_ACTIVITY')

  } catch (err) {
    result.error = err.message
  }

  return result
}

import axios from 'axios'

const COOPS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
const NWS_BASE = 'https://api.weather.gov'

export const COOPS_STATIONS = {
  '8735180': 'Dauphin Island',
  '8737048': 'Mobile State Docks',
  '8735391': 'Dog River Bridge',
}

export async function getCoopsData(stationId, product = 'water_level', hours = 24) {
  try {
    const now = new Date()
    const begin = new Date(now - hours * 3600000)
    const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '')
    const { data } = await axios.get(COOPS_BASE, {
      params: {
        begin_date: fmt(begin), end_date: fmt(now),
        station: stationId, product,
        datum: 'MLLW', time_zone: 'lst_ldt',
        units: 'english', application: 'terrawatch', format: 'json',
      },
      timeout: 10000,
    })
    return (data?.data || []).map(d => ({ timestamp: d.t, value: parseFloat(d.v), flag: d.f }))
  } catch (err) {
    console.error(`[COOPS] ${stationId} ${product}:`, err.message)
    return []
  }
}

export async function getAllCoopsConditions() {
  const results = {}
  await Promise.allSettled(
    Object.entries(COOPS_STATIONS).map(async ([id, name]) => {
      const [wl, wt, sal, wind, ap, at] = await Promise.all([
        getCoopsData(id, 'water_level',       2),
        getCoopsData(id, 'water_temperature', 2),
        getCoopsData(id, 'salinity',          2),
        getCoopsData(id, 'wind',              2),
        getCoopsData(id, 'air_pressure',      2),
        getCoopsData(id, 'air_temperature',   2),
      ])
      results[id] = {
        name, id,
        water_level:       wl.at(-1)   || null,
        water_temperature: wt.at(-1)   || null,
        salinity:          sal.at(-1)  || null,
        wind:              wind.at(-1) || null,   // {timestamp, value (speed knots), flag} — direction in .s field for CO-OPS
        air_pressure:      ap.at(-1)   || null,
        air_temperature:   at.at(-1)   || null,
      }
    })
  )
  return results
}

export async function getMobileWeather() {
  try {
    const { data: pts } = await axios.get(`${NWS_BASE}/points/30.694,-88.043`, { timeout: 8000 })
    const [forecastResp, stationsResp] = await Promise.all([
      axios.get(pts.properties.forecast, { timeout: 8000 }),
      axios.get(pts.properties.observationStations, { timeout: 8000 }),
    ])
    const stationId = stationsResp?.data?.features?.[0]?.id
    const obsResp = stationId
      ? await axios.get(`${stationId}/observations/latest`, { timeout: 8000 })
      : null
    const obs = obsResp?.data?.properties || {}

    return {
      forecast: forecastResp?.data?.properties?.periods?.slice(0, 7) || [],
      current: {
        temp_f:         obs.temperature?.value != null ? (obs.temperature.value * 9) / 5 + 32 : null,
        temp_c:         obs.temperature?.value ?? null,
        wind_speed_mph: obs.windSpeed?.value != null ? obs.windSpeed.value * 0.621371 : null,
        wind_speed_ms:  obs.windSpeed?.value ?? null,
        wind_gust_mph:  obs.windGust?.value  != null ? obs.windGust.value  * 0.621371 : null,
        wind_gust_ms:   obs.windGust?.value  ?? null,
        wind_direction: obs.windDirection?.value,
        humidity:       obs.relativeHumidity?.value,
        dewpoint_c:     obs.dewpoint?.value ?? null,
        pressure_mb:    obs.barometricPressure?.value != null ? obs.barometricPressure.value / 100 : null,
        visibility_m:   obs.visibility?.value ?? null,
        description:    obs.textDescription,
        timestamp:      obs.timestamp,
      },
    }
  } catch (err) {
    console.error('[NWS] Error:', err.message)
    return { forecast: [], current: {} }
  }
}

export async function getActiveAlerts() {
  try {
    const { data } = await axios.get(`${NWS_BASE}/alerts/active?area=AL`, { timeout: 8000 })
    return (data?.features || [])
      .filter(f => (f.properties?.affectedZones || []).some(z => z.includes('ALZ') || z.includes('AMZ')))
      .map(f => ({
        id: f.properties.id,
        event: f.properties.event,
        severity: f.properties.severity,
        headline: f.properties.headline,
        onset: f.properties.onset,
        expires: f.properties.expires,
      }))
  } catch (err) {
    console.error('[NWS Alerts]:', err.message)
    return []
  }
}

export async function getBuoyData(stationId = '42012') {
  try {
    const { data } = await axios.get(
      `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`,
      { timeout: 8000, responseType: 'text' }
    )
    const lines = data.split('\n').filter(l => l && !l.startsWith('#'))
    const headers = lines[0].trim().split(/\s+/)
    const latest = lines[2]?.trim().split(/\s+/) || []
    const record = {}
    headers.forEach((h, i) => {
      const v = latest[i]
      record[h] = v === 'MM' ? null : isNaN(Number(v)) ? v : Number(v)
    })
    return record
  } catch (err) {
    console.error('[NDBC]:', err.message)
    return null
  }
}

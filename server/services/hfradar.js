import axios from 'axios'

const ERDDAP_BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap'
const DATASET_6KM  = 'ucsdHfrE6'
const DATASET_1KM  = 'ucsdHfrE1'

const AOI = { latMin: 30.0, latMax: 31.2, lonMin: -88.8, lonMax: -87.5 }

export async function getMobileBayCurrents(resolution = '6km') {
  const dataset = resolution === '1km' ? DATASET_1KM : DATASET_6KM

  try {
    const url = `${ERDDAP_BASE}/${dataset}.json`
    const query = `u[(last)][${AOI.latMin}:${AOI.latMax}][${AOI.lonMin}:${AOI.lonMax}],v[(last)][${AOI.latMin}:${AOI.latMax}][${AOI.lonMin}:${AOI.lonMax}]`

    const { data } = await axios.get(`${url}?${encodeURIComponent(query)}`, { timeout: 15000 })
    return parseErddapCurrents(data, resolution)
  } catch (err) {
    try {
      const altUrl = `${ERDDAP_BASE}/${dataset}.json?u%5B(last)%5D%5B${AOI.latMin}%3A${AOI.latMax}%5D%5B${AOI.lonMin}%3A${AOI.lonMax}%5D%2Cv%5B(last)%5D%5B${AOI.latMin}%3A${AOI.latMax}%5D%5B${AOI.lonMin}%3A${AOI.lonMax}%5D`
      const { data } = await axios.get(altUrl, { timeout: 15000 })
      return parseErddapCurrents(data, resolution)
    } catch (err2) {
      console.error('[HF Radar] ERDDAP error:', err2.message)
      return { available: false, error: err2.message, note: 'HF Radar data unavailable' }
    }
  }
}

export async function getCurrentSummary() {
  const data = await getMobileBayCurrents()
  if (!data.available || !data.vectors?.length) {
    return { available: false, error: data.error }
  }

  const vecs = data.vectors.filter(v => v.u != null && v.v != null)
  if (!vecs.length) return { available: false, error: 'No valid current vectors in AOI' }

  const avgU = vecs.reduce((s, v) => s + v.u, 0) / vecs.length
  const avgV = vecs.reduce((s, v) => s + v.v, 0) / vecs.length
  const avgSpeed = Math.sqrt(avgU ** 2 + avgV ** 2)
  const dirDeg = (Math.atan2(avgU, avgV) * 180 / Math.PI + 360) % 360

  const distKm14h = (avgSpeed * 14 * 3600) / 1000
  const distKm24h = (avgSpeed * 24 * 3600) / 1000

  const displace14h = {
    dlat: (avgV * 14 * 3600) / 111000,
    dlon: (avgU * 14 * 3600) / (111000 * Math.cos(30.5 * Math.PI / 180)),
  }

  return {
    available: true,
    timestamp: data.timestamp,
    resolution: data.resolution,
    avgSpeed_ms: Math.round(avgSpeed * 100) / 100,
    avgSpeed_knots: Math.round(avgSpeed * 1.944 * 100) / 100,
    direction_deg: Math.round(dirDeg),
    directionCardinal: degToCardinal(dirDeg),
    vectorCount: vecs.length,
    bloom_transport: {
      distance_14h_km: Math.round(distKm14h * 10) / 10,
      distance_24h_km: Math.round(distKm24h * 10) / 10,
      displacement_14h: displace14h,
      note: `At current speed, a surface bloom travels ~${Math.round(distKm14h)} km in 14 hours`,
    },
    source: `NOAA HF Radar — ${data.resolution} resolution — ERDDAP`,
    dataUrl: `https://coastwatch.pfeg.noaa.gov/erddap/griddap/${DATASET_6KM}.html`,
  }
}

function parseErddapCurrents(data, resolution) {
  try {
    const rows = data?.table?.rows || []
    const cols = data?.table?.columnNames || []
    const timeIdx = cols.indexOf('time')
    const latIdx  = cols.indexOf('latitude')
    const lonIdx  = cols.indexOf('longitude')
    const uIdx    = cols.indexOf('u')
    const vIdx    = cols.indexOf('v')

    if (uIdx === -1 || vIdx === -1) {
      return { available: false, error: 'Unexpected ERDDAP column structure', raw: cols }
    }

    const vectors = rows
      .filter(r => r[uIdx] != null && r[vIdx] != null)
      .map(r => ({
        lat:  r[latIdx],
        lon:  r[lonIdx],
        u:    r[uIdx],
        v:    r[vIdx],
        speed: Math.sqrt((r[uIdx] || 0) ** 2 + (r[vIdx] || 0) ** 2),
      }))

    return {
      available: true,
      timestamp: rows[0]?.[timeIdx] || new Date().toISOString(),
      resolution,
      vectors,
      count: vectors.length,
      aoi: AOI,
    }
  } catch (err) {
    return { available: false, error: `Parse error: ${err.message}` }
  }
}

function degToCardinal(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

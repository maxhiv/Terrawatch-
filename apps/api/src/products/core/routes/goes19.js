import express from 'express'
import { writeReadings, getLatestGOESReadings } from '../../../data/database.js'

const router = express.Router()

let latestScan = null
const MOBILE_BAY_LAT = 30.5
const MOBILE_BAY_LON = -88.0

function verifyGoesKey(req, res, next) {
  const key = req.headers['x-api-key']
  if (!process.env.GOES19_API_KEY) {
    console.error('[GOES19] GOES19_API_KEY not configured')
    return res.status(503).json({ error: 'Endpoint not configured' })
  }
  if (key !== process.env.GOES19_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

function isNum(v) { return typeof v === 'number' && isFinite(v) }

function normalizePayload(raw) {
  const products = raw.payload?.products || raw
  const scan_timestamp = raw.scan_timestamp || raw.payload?.scan_timestamp || raw.payload?.timestamp || new Date().toISOString()

  const sst = products.sst ? {
    mean_c:      products.sst.mean_c      ?? products.sst.bay_mean_c   ?? null,
    gradient_c:  products.sst.gradient_c  ?? null,
    pixel_count: products.sst.pixel_count ?? products.sst.pixels_valid ?? null,
    min_c:       products.sst.bay_min_c   ?? null,
    max_c:       products.sst.bay_max_c   ?? null,
    offshore_c:  products.sst.offshore_c  ?? null,
  } : null

  const qpe = products.qpe ? {
    rainfall_mm:  products.qpe.rainfall_mm    ?? products.qpe.bay_rain_mm_hr      ?? null,
    accum_6h_mm:  products.qpe.accum_6h_mm    ?? products.qpe.cumulative_6h_mm    ?? null,
    accum_24h_mm: products.qpe.accum_24h_mm   ?? products.qpe.cumulative_24h_mm   ?? null,
    accum_48h_mm: products.qpe.cumulative_48h_mm ?? null,
  } : null

  const cloud_mask = products.cloud_mask ? {
    coverage_pct: products.cloud_mask.coverage_pct ?? products.cloud_mask.bay_cloud_pct ?? null,
    clear_pct:    products.cloud_mask.bay_clear_pct ?? null,
  } : null

  const glm = products.glm ? {
    flash_count:      products.glm.flash_count      ?? products.glm.flashes_5min ?? null,
    lightning_active: products.glm.lightning_active  ?? (isNum(products.glm.flashes_5min) ? products.glm.flashes_5min > 0 : null),
    active_cells:     products.glm.active_cells     ?? null,
  } : null

  const winds = products.amv_winds || products.winds || null
  const amv_winds = winds ? {
    speed_ms:      winds.speed_ms      ?? null,
    direction_deg: winds.direction_deg ?? null,
    amv_count:     winds.amv_count     ?? null,
  } : null

  const rgbSrc = products.rgb_ratios || products.rgb || null
  const rgb_ratios = rgbSrc ? {
    bloom_index:   rgbSrc.bloom_index    ?? null,
    turbidity_idx: rgbSrc.turbidity_idx  ?? rgbSrc.turbidity_index ?? null,
    green_band:    rgbSrc.green_band_mean ?? null,
    red_band:      rgbSrc.red_band_mean   ?? null,
  } : null

  const cdmo = products.cdmo || null

  return { scan_timestamp, sst, qpe, cloud_mask, glm, amv_winds, rgb_ratios, cdmo }
}

router.post('/ingest', verifyGoesKey, async (req, res) => {
  const raw = req.body

  if (!raw) {
    return res.status(400).json({ error: 'Empty body' })
  }

  const payload = normalizePayload(raw)

  const tsMs = Date.parse(payload.scan_timestamp)
  if (isNaN(tsMs)) {
    return res.status(400).json({ error: 'Invalid scan_timestamp format — must be ISO 8601 or parseable date string' })
  }

  try {
    const { sst, qpe, cloud_mask, rgb_ratios, glm, amv_winds, cdmo } = payload

    const ts = tsMs
    const src = 'GOES19-PUSH'
    const station = 'GOES19-ABI'
    const rows = []
    const errors = []

    if (sst) {
      if (sst.mean_c != null && !isNum(sst.mean_c)) errors.push('sst.mean_c must be a number')
      if (sst.gradient_c != null && !isNum(sst.gradient_c)) errors.push('sst.gradient_c must be a number')
      if (sst.pixel_count != null && !isNum(sst.pixel_count)) errors.push('sst.pixel_count must be a number')
      if (isNum(sst.mean_c)) rows.push([ts, src, station, 'sst_mean', sst.mean_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(sst.gradient_c)) rows.push([ts, src, station, 'sst_gradient', sst.gradient_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(sst.pixel_count)) rows.push([ts, src, station, 'sst_pixels', sst.pixel_count, 'count', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(sst.offshore_c)) rows.push([ts, src, station, 'sst_offshore', sst.offshore_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (qpe) {
      if (qpe.rainfall_mm != null && !isNum(qpe.rainfall_mm)) errors.push('qpe.rainfall_mm must be a number')
      if (qpe.accum_6h_mm != null && !isNum(qpe.accum_6h_mm)) errors.push('qpe.accum_6h_mm must be a number')
      if (qpe.accum_24h_mm != null && !isNum(qpe.accum_24h_mm)) errors.push('qpe.accum_24h_mm must be a number')
      if (isNum(qpe.rainfall_mm)) rows.push([ts, src, station, 'qpe_rainfall', qpe.rainfall_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(qpe.accum_6h_mm)) rows.push([ts, src, station, 'qpe_6h', qpe.accum_6h_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(qpe.accum_24h_mm)) rows.push([ts, src, station, 'qpe_24h', qpe.accum_24h_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(qpe.accum_48h_mm)) rows.push([ts, src, station, 'qpe_48h', qpe.accum_48h_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (cloud_mask && cloud_mask.coverage_pct != null) {
      if (!isNum(cloud_mask.coverage_pct)) errors.push('cloud_mask.coverage_pct must be a number')
      else rows.push([ts, src, station, 'cloud_coverage', cloud_mask.coverage_pct, '%', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (glm) {
      if (glm.flash_count != null && !isNum(glm.flash_count)) errors.push('glm.flash_count must be a number')
      if (isNum(glm.flash_count)) rows.push([ts, src, station, 'glm_flashes', glm.flash_count, 'count', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (glm.lightning_active != null) rows.push([ts, src, station, 'glm_active', glm.lightning_active ? 1 : 0, 'bool', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (amv_winds) {
      if (amv_winds.speed_ms != null && !isNum(amv_winds.speed_ms)) errors.push('amv_winds.speed_ms must be a number')
      if (amv_winds.direction_deg != null && !isNum(amv_winds.direction_deg)) errors.push('amv_winds.direction_deg must be a number')
      if (isNum(amv_winds.speed_ms)) rows.push([ts, src, station, 'amv_wind_speed', amv_winds.speed_ms, 'm/s', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(amv_winds.direction_deg)) rows.push([ts, src, station, 'amv_wind_dir', amv_winds.direction_deg, 'deg', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (rgb_ratios != null) {
      rows.push([ts, src, station, 'rgb_ratios', JSON.stringify(rgb_ratios), 'json', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (cdmo) {
      if (isNum(cdmo.do_mgl)) rows.push([ts, src, 'NERRS-PUSH', 'do_mgl', cdmo.do_mgl, 'mg/L', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(cdmo.temp_c)) rows.push([ts, src, 'NERRS-PUSH', 'water_temp', cdmo.temp_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(cdmo.salinity)) rows.push([ts, src, 'NERRS-PUSH', 'salinity', cdmo.salinity, 'ppt', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(cdmo.ph)) rows.push([ts, src, 'NERRS-PUSH', 'ph', cdmo.ph, '', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(cdmo.turbidity)) rows.push([ts, src, 'NERRS-PUSH', 'turbidity', cdmo.turbidity, 'NTU', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (isNum(cdmo.depth_m)) rows.push([ts, src, 'NERRS-PUSH', 'depth', cdmo.depth_m, 'm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }

    if (rows.length > 0) {
      await writeReadings(rows)
    }

    const isoTs = new Date(tsMs).toISOString()
    latestScan = { scan_timestamp: isoTs, received_at: new Date().toISOString(), payload: raw, readings_written: rows.length }

    console.log(`[GOES19] Ingested scan ${isoTs} — ${rows.length} readings written (sst:${sst?.mean_c ?? '-'} qpe:${qpe?.rainfall_mm ?? '-'} cloud:${cloud_mask?.coverage_pct ?? '-'} bloom:${rgb_ratios?.bloom_index ?? '-'} glm:${glm?.flash_count ?? '-'} winds:${amv_winds?.speed_ms ?? '-'} cdmo:${cdmo ? 'yes' : 'no'})`)

    res.json({
      status: 'ok',
      readings_written: rows.length,
      scan_timestamp: isoTs
    })
  } catch (err) {
    console.error('[GOES19] Ingest error:', err)
    res.status(500).json({ error: 'Ingest failed' })
  }
})

router.get('/latest', (req, res) => {
  if (!latestScan) {
    return res.json({ status: 'no_data', message: 'No GOES-19 scans received yet' })
  }
  res.json({ status: 'ok', ...latestScan })
})

router.get('/db', async (req, res) => {
  try {
    const readings = await getLatestGOESReadings()
    res.json({ status: 'ok', readings, count: Object.keys(readings).filter(k => readings[k] != null).length })
  } catch (err) {
    console.error('[GOES19] DB query error:', err.message)
    res.json({ status: 'error', readings: {}, error: err.message })
  }
})

router.get('/health', (req, res) => {
  res.json({
    status: latestScan ? 'receiving' : 'waiting',
    configured: !!process.env.GOES19_API_KEY,
    last_scan: latestScan?.scan_timestamp || null,
    last_received: latestScan?.received_at || null
  })
})

export default router

import express from 'express'
import { writeReadings } from '../services/database.js'

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

router.post('/ingest', verifyGoesKey, async (req, res) => {
  const payload = req.body

  if (!payload || !payload.scan_timestamp) {
    return res.status(400).json({ error: 'Missing scan_timestamp' })
  }

  try {
    const {
      scan_timestamp,
      sst,
      qpe,
      cloud_mask,
      rgb_ratios,
      glm,
      amv_winds
    } = payload

    const ts = new Date(scan_timestamp).toISOString()
    const src = 'GOES19-PUSH'
    const station = 'GOES19-ABI'
    const rows = []

    if (sst) {
      if (sst.mean_c != null) rows.push([ts, src, station, 'sst_mean', sst.mean_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (sst.gradient_c != null) rows.push([ts, src, station, 'sst_gradient', sst.gradient_c, '°C', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (sst.pixel_count != null) rows.push([ts, src, station, 'sst_pixels', sst.pixel_count, 'count', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (qpe) {
      if (qpe.rainfall_mm != null) rows.push([ts, src, station, 'qpe_rainfall', qpe.rainfall_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (qpe.accum_6h_mm != null) rows.push([ts, src, station, 'qpe_6h', qpe.accum_6h_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (qpe.accum_24h_mm != null) rows.push([ts, src, station, 'qpe_24h', qpe.accum_24h_mm, 'mm', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (cloud_mask && cloud_mask.coverage_pct != null) {
      rows.push([ts, src, station, 'cloud_coverage', cloud_mask.coverage_pct, '%', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (glm) {
      if (glm.flash_count != null) rows.push([ts, src, station, 'glm_flashes', glm.flash_count, 'count', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (glm.lightning_active != null) rows.push([ts, src, station, 'glm_active', glm.lightning_active ? 1 : 0, 'bool', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (amv_winds) {
      if (amv_winds.speed_ms != null) rows.push([ts, src, station, 'amv_wind_speed', amv_winds.speed_ms, 'm/s', MOBILE_BAY_LAT, MOBILE_BAY_LON])
      if (amv_winds.direction_deg != null) rows.push([ts, src, station, 'amv_wind_dir', amv_winds.direction_deg, 'deg', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (rgb_ratios != null) {
      rows.push([ts, src, station, 'rgb_ratios', JSON.stringify(rgb_ratios), 'json', MOBILE_BAY_LAT, MOBILE_BAY_LON])
    }

    if (rows.length > 0) {
      await writeReadings(rows)
    }

    latestScan = { scan_timestamp: ts, received_at: new Date().toISOString(), payload, readings_written: rows.length }

    console.log(`[GOES19] Ingested scan ${ts} — ${rows.length} readings written`)

    res.json({
      status: 'ok',
      readings_written: rows.length,
      scan_timestamp: ts
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

router.get('/health', (req, res) => {
  res.json({
    status: latestScan ? 'receiving' : 'waiting',
    configured: !!process.env.GOES19_API_KEY,
    last_scan: latestScan?.scan_timestamp || null,
    last_received: latestScan?.received_at || null
  })
})

export default router

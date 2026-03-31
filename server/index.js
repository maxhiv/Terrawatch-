import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import cron from 'node-cron'

import waterQualityRoutes from './routes/waterQuality.js'
import habOracleRoutes from './routes/habOracle.js'
import weatherRoutes from './routes/weather.js'
import alertsRoutes from './routes/alerts.js'
import sensorsRoutes from './routes/sensors.js'
import aiRoutes from './routes/ai.js'
import mlRoutes from './routes/mlArchitecture.js'
import intelligenceRoutes from './routes/intelligence.js'
import goes19Routes from './routes/goes19.js'

import { getRealtimeData as getUSGSData } from './services/usgs.js'
import { getAllCoopsConditions as getNOAAData, getBuoyData, getMobileWeather } from './services/noaa.js'
import { getCurrentSummary } from './services/hfradar.js'
import { getWeeksBayLatest } from './services/nerrs.js'
import { getMobileAQI } from './services/epa.js'
import { getAllSatelliteStatus } from './services/satellite.js'
import { getAllOceanStatus } from './services/ocean.js'
import { getAllEcologyStatus } from './services/ecology.js'
import { getAllLandRegWeatherStatus } from './services/landregweather.js'
import { getAllAirQualityStatus } from './services/airplus.js'
import { persistTick } from './services/crossSensor.js'
import { retrainHABOracle } from './services/mlTrainer.js'
import { getDBStats, saveDB, getLatestGOESReadings } from './services/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)
app.use(cors({ origin: '*' }))
app.use(express.json())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true })
app.use('/api', limiter)

app.use('/api/water', waterQualityRoutes)
app.use('/api/hab', habOracleRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/sensors', sensorsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/intelligence', intelligenceRoutes)
app.use('/api/goes19', goes19Routes)

app.get('/api/health', async (req, res) => {
  let dbStats = null
  try { dbStats = await getDBStats() } catch {}
  const phase = dbStats?.labeled >= 2000 ? 3 : dbStats?.labeled >= 500 ? 2 : dbStats?.labeled >= 100 ? 1 : 0
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    platform: 'TERRAWATCH',
    intelligence: {
      phase,
      readings:    dbStats?.readings    || 0,
      vectors:     dbStats?.vectors     || 0,
      labeled:     dbStats?.labeled     || 0,
      phase3Ready: dbStats?.phase3Ready || false,
    },
    dataSources: {
      fast: {
        usgs:        (_latestData.waterQuality?.usgs?.length  || 0) > 0,
        coops:       Object.keys(_latestData.waterQuality?.coops || {}).length > 0,
        nerrs:       _latestData.nerrs?.waterQuality?.available ?? false,
        hfRadar:     _latestData.hfRadar?.available ?? false,
        aqi:         _latestData.aqi?.available ?? false,
        goes_push:   _latestData.goesLatest?.sst_gradient != null,
        buoy:        _latestData.buoy?.WTMP != null,
        nws_weather: _latestData.weather?.current?.wind_speed_mph != null,
      },
      slow: {
        satellite:  _latestData.satellite != null,
        ocean:      _latestData.ocean     != null,
        ecology:    _latestData.ecology   != null,
        land:       _latestData.land      != null,
        airplus:    _latestData.airplus   != null,
      },
      featureVectorSize: Object.keys(_latestData).length > 2 ? '95+' : '~40',
    },
  })
})

app.get('/api/goes19/push-latest', (req, res) => {
  res.json(_latestData.goesLatest || {})
})

const distPath = join(__dirname, '../dist')
if (existsSync(join(distPath, 'index.html'))) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
}

// ── In-memory data cache ──────────────────────────────────────────────────────
// Fast sources (USGS, CO-OPS, HF Radar, NERRS, AQI, GOES DB) refresh every 3 min.
// Slow sources (satellite, ocean, ecology, land, air quality) refresh every 15 min.
// Both layers are merged into _latestData so every persistTick call has the full picture.
// Slow sources default to {} so the feature vector degrades gracefully until first fetch.

let _latestData = {
  waterQuality: { usgs: [], coops: {} },
  hfRadar:    null,
  nerrs:      null,
  aqi:        null,
  goesLatest: null,
  buoy:       null,   // NDBC Buoy 42012 — offshore Gulf temp, wind, pressure
  weather:    null,   // NOAA NWS — surface wind speed + direction at Mobile
  // Slow sources — populated by the 15-min cron, retained between fast ticks
  satellite:  null,
  ocean:      null,
  ecology:    null,
  land:       null,
  airplus:    null,
}

// ── Fast cron: every 3 minutes ───────────────────────────────────────────────
// USGS, CO-OPS, HF Radar, NERRS, AirNow, GOES DB lookup (local — instant)
cron.schedule('*/3 * * * *', async () => {
  try {
    const [usgs, noaa, hfRadar, nerrs, aqi, goesLatest, buoy, weather] = await Promise.allSettled([
      getUSGSData(),
      getNOAAData(),
      getCurrentSummary(),
      getWeeksBayLatest(),
      getMobileAQI(),
      getLatestGOESReadings(),   // reads local SQLite — zero network latency
      getBuoyData('42012'),      // NDBC offshore Gulf buoy
      getMobileWeather(),        // NOAA NWS surface wind + temp
    ])

    _latestData = {
      ..._latestData,
      waterQuality: usgs.status === 'fulfilled' && noaa.status === 'fulfilled'
        ? { usgs: usgs.value || [], coops: noaa.value || {} }
        : {
            usgs:  usgs.status  === 'fulfilled' ? (usgs.value || []) : (_latestData.waterQuality?.usgs || []),
            coops: noaa.status  === 'fulfilled' ? (noaa.value || {}) : (_latestData.waterQuality?.coops || {}),
          },
      hfRadar:    hfRadar.status    === 'fulfilled' ? (hfRadar.value    ?? null) : _latestData.hfRadar,
      nerrs:      nerrs.status      === 'fulfilled' ? (nerrs.value      ?? null) : _latestData.nerrs,
      aqi:        aqi.status        === 'fulfilled' ? (aqi.value        ?? null) : _latestData.aqi,
      goesLatest: goesLatest.status === 'fulfilled' ? (goesLatest.value ?? null) : _latestData.goesLatest,
      buoy:       buoy.status       === 'fulfilled' ? (buoy.value       ?? null) : _latestData.buoy,
      weather:    weather.status    === 'fulfilled' ? (weather.value    ?? null) : _latestData.weather,
    }

    const result = await persistTick(_latestData)
    if (result.ok) {
      const goesTag    = result.goesFeatures       ? ' ✓GOES'    : ''
      const buoyTag    = _latestData.buoy?.WTMP != null ? ' ✓buoy' : ''
      const weatherTag = _latestData.weather?.current?.wind_speed_mph != null ? ' ✓NWS' : ''
      const ecoTag     = _latestData.ecology         ? ' ✓eco'    : ''
      const satTag     = _latestData.satellite       ? ' ✓sat'    : ''
      const landTag    = _latestData.land            ? ' ✓land'   : ''
      const airTag     = _latestData.airplus         ? ' ✓air'    : ''
      console.log(
        `[CRON:3m] ${result.readings} readings | labeled: ${result.labeled}` +
        ` (hab:${result.labels?.hab} hypoxia:${result.labels?.hypoxia})` +
        goesTag + buoyTag + weatherTag + ecoTag + satTag + landTag + airTag
      )
    }
  } catch (err) {
    console.error('[CRON:3m] Error:', err.message)
  }
})

// ── Slow cron: every 15 minutes ──────────────────────────────────────────────
// Satellite status (NASA CMR), ocean models (HYCOM/CMEMS), ecology (iNaturalist/GBIF/eBird),
// land + weather (Open-Meteo, AHPS, FEMA, SSURGO), air quality (EPA AQS, OpenAQ, PurpleAir).
// These are external APIs — staggered with Promise.allSettled so one slow call can't block others.
cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('[CRON:15m] Fetching slow sources: satellite · ocean · ecology · land · airplus')

    const [satellite, ocean, ecology, land, airplus] = await Promise.allSettled([
      getAllSatelliteStatus(),
      getAllOceanStatus(),
      getAllEcologyStatus(),
      getAllLandRegWeatherStatus(),
      getAllAirQualityStatus(),
    ])

    // Merge into _latestData — the next fast cron tick will include these
    _latestData = {
      ..._latestData,
      satellite: satellite.status === 'fulfilled' ? satellite.value : _latestData.satellite,
      ocean:     ocean.status     === 'fulfilled' ? ocean.value     : _latestData.ocean,
      ecology:   ecology.status   === 'fulfilled' ? ecology.value   : _latestData.ecology,
      land:      land.status      === 'fulfilled' ? land.value      : _latestData.land,
      airplus:   airplus.status   === 'fulfilled' ? airplus.value   : _latestData.airplus,
    }

    const connected = [
      satellite.status === 'fulfilled' && 'satellite',
      ocean.status     === 'fulfilled' && 'ocean',
      ecology.status   === 'fulfilled' && 'ecology',
      land.status      === 'fulfilled' && 'land',
      airplus.status   === 'fulfilled' && 'airplus',
    ].filter(Boolean)
    console.log(`[CRON:15m] Updated: ${connected.join(' · ')}`)
  } catch (err) {
    console.error('[CRON:15m] Error:', err.message)
  }
})

// ── Hourly HAB Oracle assessment log ─────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  console.log('[CRON:1h] HAB Oracle standing assessment — use /api/hab/assess for on-demand.')
})

cron.schedule('0 0 * * 0', async () => {
  console.log('[CRON] Weekly ML retraining started...')
  try {
    const result = await retrainHABOracle()
    console.log('[CRON] Retrain result:', result.status, '| AUC-ROC:', result.aucRoc, '| Samples:', result.nSamples)
  } catch (err) {
    console.error('[CRON] Retrain error:', err.message)
  }
})

cron.schedule('*/10 * * * *', () => {
  try { saveDB() } catch {}
})

setTimeout(async () => {
  try {
    const stats = await getDBStats()
    const phase = stats.labeled >= 2000 ? 3 : stats.labeled >= 500 ? 2 : stats.labeled >= 100 ? 1 : 0
    console.log(`\n[Intelligence] DB: ${stats.readings} readings | ${stats.vectors} vectors | ${stats.labeled} labeled | Phase ${phase} | ${stats.dbSizeMB}MB`)
    if (stats.phase3Ready) {
      console.log('[Intelligence] *** PHASE 3 READY — Add GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY to activate CNN-LSTM training ***')
    }
  } catch {}
}, 3000)

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  TERRAWATCH v2.1 — Full-Stack Intelligence Platform      ║
║  Port: ${PORT}                                              ║
║  CRON 3min  → USGS · CO-OPS · NERRS · HFRadar · GOES-DB ║
║               NDBC Buoy · NWS Weather · AirNow           ║
║  CRON 15min → Satellite · Ocean · Ecology · Land · Air   ║
║  ML vector  → 95+ features from 15 live data sources     ║
║  Phase 1+2 active — SQLite persistence + auto-label      ║
║  Phase 3 pre-wired — Vertex AI CNN-LSTM on threshold     ║
║  "Give the world eyes on its ecosystems."                ║
╚══════════════════════════════════════════════════════════╝
  `)
})

export default app

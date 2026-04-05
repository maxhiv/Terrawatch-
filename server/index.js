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
import alertsRoutes, { ingestAlerts } from './routes/alerts.js'
import sensorsRoutes from './routes/sensors.js'
import aiRoutes from './routes/ai.js'
import mlRoutes from './routes/mlArchitecture.js'
import intelligenceRoutes from './routes/intelligence.js'
import goes19Routes from './routes/goes19.js'
import floodRoutes from './routes/flood.js'
import beachRoutes from './routes/beach.js'
import climateRoutes from './routes/climate.js'
import pollutionRoutes from './routes/pollution.js'
import dataSourcesRouter from './routes/dataSources.js'
import { startPoller } from './jobs/dataSourcePoller.js'

import { getRealtimeData as getUSGSData } from './services/usgs.js'
import { getAllCoopsConditions as getNOAAData, getBuoyData, getMobileWeather } from './services/noaa.js'
import { getCurrentSummary } from './services/hfradar.js'
import { getWeeksBayLatest } from './services/nerrs.js'
import { getMobileAQI, getWQPDO2 } from './services/epa.js'
import { getAllSatelliteStatus } from './services/satellite.js'
import { getAllOceanStatus } from './services/ocean.js'
import { getAllEcologyStatus } from './services/ecology.js'
import { getAllLandRegWeatherStatus } from './services/landregweather.js'
import { getAllAirQualityStatus } from './services/airplus.js'
import { persistTick } from './services/crossSensor.js'
import { retrainHABOracle, runInference, backfillUnlabeledVectors } from './services/mlTrainer.js'
import { getDBStats, saveDB, getLatestGOESReadings, writeSourceHealth, getLatestVector, getLatestSnapshots } from './services/database.js'
import { getADPHClosures } from './services/adph.js'
import { buildFeatureVector } from './services/crossSensor.js'

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
app.use('/api/flood', floodRoutes)
app.use('/api/beach', beachRoutes)
app.use('/api/climate', climateRoutes)
app.use('/api/pollution', pollutionRoutes)
app.use('/api/datasources', dataSourcesRouter)

app.get('/api/health', async (req, res) => {
  let dbStats = null
  try { dbStats = await getDBStats() } catch (dbErr) { /* DB may not be initialized yet */ }
  const phase = dbStats?.labeled >= 2000 ? 3 : dbStats?.labeled >= 500 ? 2 : dbStats?.labeled >= 100 ? 1 : 0
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '2.2.0',
    platform: 'TERRAWATCH',
    intelligence: {
      phase,
      readings:    dbStats?.readings    || 0,
      vectors:     dbStats?.vectors     || 0,
      labeled:     dbStats?.labeled     || 0,
      phase3Ready: dbStats?.phase3Ready || false,
    },
    featureVectorSize: 152,
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
    },
  })
})

app.get('/api/goes19/push-latest', (req, res) => {
  res.json(_latestData.goesLatest || {})
})

app.get('/api/adph/closures', async (req, res) => {
  try {
    const closures = await getADPHClosures()
    res.json(closures)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/inference/latest', async (req, res) => {
  try {
    const data = _latestData
    const vector = buildFeatureVector(data)
    const result = await runInference(vector)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const distPath = join(__dirname, '../dist')
if (existsSync(join(distPath, 'index.html'))) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
}

function getGoesLatest() { return _latestData.goesLatest || {} }
app.locals.getGoesLatest = getGoesLatest
app.locals.getLatestData = () => _latestData

let _latestData = {
  waterQuality: { usgs: [], coops: {} },
  hfRadar:    null,
  nerrs:      null,
  nerrsSecondary: null,
  wqpDO2:     null,
  aqi:        null,
  goesLatest: null,
  buoy:       null,
  weather:    null,
  satellite:  null,
  ocean:      null,
  ecology:    null,
  land:       null,
  airplus:    null,
}

async function evaluateAndDispatchAlerts(features) {
  const alerts = []
  if (features.min_do2 != null && features.min_do2 < 3.0) {
    alerts.push({ type: 'hypoxia', severity: 'critical', message: `DO₂ critically low: ${features.min_do2.toFixed(1)} mg/L`, value: features.min_do2, source: 'cron_ml' })
  } else if (features.min_do2 != null && features.min_do2 < 5.0) {
    alerts.push({ type: 'hypoxia', severity: 'warning', message: `DO₂ below stress threshold: ${features.min_do2.toFixed(1)} mg/L`, value: features.min_do2, source: 'cron_ml' })
  }
  if (features.goes_stratification_alert) {
    alerts.push({ type: 'stratification', severity: 'warning', message: `GOES-19 SST gradient: ${features.goes_sst_gradient?.toFixed(1)}°C/km — stratification alert`, value: features.goes_sst_gradient, source: 'cron_ml' })
  }
  if (features.goes_bloom_alert) {
    alerts.push({ type: 'bloom', severity: 'warning', message: `Satellite bloom signal detected (index: ${features.goes_bloom_index?.toFixed(2)})`, value: features.goes_bloom_index, source: 'cron_ml' })
  }
  if (features.compound_stress_index != null && features.compound_stress_index > 0.7) {
    alerts.push({ type: 'compound_stress', severity: 'critical', message: `Compound stress index elevated: ${features.compound_stress_index}`, value: features.compound_stress_index, source: 'cron_ml' })
  }
  if (features.ahps_flood_stage_ft != null && features.ahps_flood_stage_ft > 12) {
    alerts.push({ type: 'flood', severity: 'warning', message: `AHPS flood stage: ${features.ahps_flood_stage_ft} ft`, value: features.ahps_flood_stage_ft, source: 'cron_ml' })
  }
  if (features.air_quality_alert) {
    alerts.push({ type: 'air_quality', severity: 'warning', message: 'PM2.5 exceeds 35 µg/m³', value: features.openaq_pm25 || features.purpleair_pm25, source: 'cron_ml' })
  }
  if (alerts.length > 0) {
    ingestAlerts(alerts)
  }
  return alerts
}

cron.schedule('*/3 * * * *', async () => {
  try {
    const startMs = Date.now()
    const [usgs, noaa, hfRadar, nerrs, aqi, goesLatest, buoy, weather] = await Promise.allSettled([
      getUSGSData(),
      getNOAAData(),
      getCurrentSummary(),
      getWeeksBayLatest(),
      getMobileAQI(),
      getLatestGOESReadings(),
      getBuoyData('42012'),
      getMobileWeather(),
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
      nerrsSecondary: nerrs.status  === 'fulfilled' ? (nerrs.value?.secondary ?? null) : _latestData.nerrsSecondary,
      wqpDO2:     _latestData.wqpDO2,
      aqi:        aqi.status        === 'fulfilled' ? (aqi.value        ?? null) : _latestData.aqi,
      goesLatest: goesLatest.status === 'fulfilled' ? (goesLatest.value ?? null) : _latestData.goesLatest,
      buoy:       buoy.status       === 'fulfilled' ? (buoy.value       ?? null) : _latestData.buoy,
      weather:    weather.status    === 'fulfilled' ? (weather.value    ?? null) : _latestData.weather,
    }

    try {
      const extSnapshots = await getLatestSnapshots()
      const extSources = {}
      for (const s of extSnapshots) {
        extSources[s.source_id] = s
      }
      _latestData.extSources = extSources
    } catch (extErr) {
      console.warn('[CRON:3m] Extended sources unavailable:', extErr.message)
    }

    const result = await persistTick(_latestData)

    if (result.ok) {
      try {
        const vector = buildFeatureVector(_latestData)
        await evaluateAndDispatchAlerts(vector)
      } catch (alertErr) {
        console.warn('[CRON:3m] Alert evaluation error:', alertErr.message)
      }

      const latencyMs = Date.now() - startMs
      try { await writeSourceHealth('fast_cron', 'ok', latencyMs, result.readings) } catch (shErr) { console.warn('[SourceHealth] write error:', shErr.message) }

      const tags = [
        result.goesFeatures && '✓GOES',
        _latestData.buoy?.WTMP != null && '✓buoy',
        _latestData.weather?.current?.wind_speed_mph != null && '✓NWS',
        _latestData.ecology && '✓eco',
        _latestData.satellite && '✓sat',
        _latestData.land && '✓land',
        _latestData.airplus && '✓air',
      ].filter(Boolean).join(' ')

      console.log(
        `[CRON:3m] ${result.readings} readings | labeled: ${result.labeled}` +
        ` (hab:${result.labels?.hab} hypoxia:${result.labels?.hypoxia})` +
        ` ${tags} | ${latencyMs}ms`
      )
    }
  } catch (err) {
    console.error('[CRON:3m] Error:', err.message)
    try { await writeSourceHealth('fast_cron', 'error', null, 0, err.message) } catch (shErr) { console.warn('[SourceHealth] write error:', shErr.message) }
  }
})

cron.schedule('*/20 * * * *', async () => {
  try {
    console.log('[CRON:20m] Fetching mid-tier sources: satellite · ocean · ecology · airplus · WQP')
    const startMs = Date.now()

    const [satellite, ocean, ecology, airplus, wqpDO2] = await Promise.allSettled([
      getAllSatelliteStatus(),
      getAllOceanStatus(),
      getAllEcologyStatus(),
      getAllAirQualityStatus(),
      getWQPDO2(),
    ])

    _latestData = {
      ..._latestData,
      satellite: satellite.status === 'fulfilled' ? satellite.value : _latestData.satellite,
      ocean:     ocean.status     === 'fulfilled' ? ocean.value     : _latestData.ocean,
      ecology:   ecology.status   === 'fulfilled' ? ecology.value   : _latestData.ecology,
      airplus:   airplus.status   === 'fulfilled' ? airplus.value   : _latestData.airplus,
      wqpDO2:    wqpDO2.status    === 'fulfilled' ? (wqpDO2.value   ?? null) : _latestData.wqpDO2,
    }

    const connected = [
      satellite.status === 'fulfilled' && 'satellite',
      ocean.status     === 'fulfilled' && 'ocean',
      ecology.status   === 'fulfilled' && 'ecology',
      airplus.status   === 'fulfilled' && 'airplus',
      wqpDO2.status    === 'fulfilled' && wqpDO2.value != null && 'wqp_do2',
    ].filter(Boolean)

    const latencyMs = Date.now() - startMs
    try { await writeSourceHealth('mid_cron', 'ok', latencyMs, connected.length) } catch (shErr) { console.warn('[SourceHealth] write error:', shErr.message) }
    console.log(`[CRON:20m] Updated: ${connected.join(' · ')} | ${latencyMs}ms`)
  } catch (err) {
    console.error('[CRON:20m] Error:', err.message)
  }
})

cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('[CRON:6h] Fetching slow-tier sources: land-reg · weather baselines')
    const startMs = Date.now()

    const [land] = await Promise.allSettled([
      getAllLandRegWeatherStatus(),
    ])

    _latestData = {
      ..._latestData,
      land: land.status === 'fulfilled' ? land.value : _latestData.land,
    }

    const latencyMs = Date.now() - startMs
    try { await writeSourceHealth('slow_cron', 'ok', latencyMs, land.status === 'fulfilled' ? 1 : 0) } catch (shErr) { console.warn('[SourceHealth] write error:', shErr.message) }
    console.log(`[CRON:6h] Updated: land-reg | ${latencyMs}ms`)
  } catch (err) {
    console.error('[CRON:6h] Error:', err.message)
  }
})

cron.schedule('0 8 * * *', async () => {
  console.log('[CRON:daily] Nightly ML retrain triggered')
  try {
    const result = await retrainHABOracle()
    console.log('[CRON:daily] Retrain result:', result.status, '| AUC-ROC:', result.aucRoc, '| Samples:', result.nSamples)
  } catch (err) {
    console.error('[CRON:daily] Retrain error:', err.message)
  }
})


cron.schedule('*/10 * * * *', () => {
  try { saveDB() } catch (saveErr) { console.warn('[SaveDB] Error:', saveErr.message) }
})

setTimeout(async () => {
  try {
    await backfillUnlabeledVectors()
    const stats = await getDBStats()
    const phase = stats.labeled >= 2000 ? 3 : stats.labeled >= 500 ? 2 : stats.labeled >= 100 ? 1 : 0
    console.log(`\n[Intelligence] DB: ${stats.readings} readings | ${stats.vectors} vectors | ${stats.labeled} labeled | Phase ${phase} | ${stats.dbSizeMB}MB`)
    if (stats.phase3Ready) {
      console.log('[Intelligence] *** PHASE 3 READY — Add GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY to activate CNN-LSTM training ***')
    }
  } catch (statErr) {
    console.warn('[Intelligence] Stats unavailable:', statErr.message)
  }
}, 3000)

app.listen(PORT, () => {
  startPoller()
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  TERRAWATCH v2.2 — Full-Stack Intelligence Platform      ║
║  Port: ${PORT}                                              ║
║  CRON 3min  → USGS · CO-OPS · NERRS · HFRadar · GOES-DB ║
║               NDBC Buoy · NWS Weather · AirNow           ║
║  CRON 20min → Satellite · Ocean · Ecology · AirPlus      ║
║  CRON 6hr   → Land-Reg · AHPS · NCEI · SSURGO · FEMA    ║
║  CRON daily → Nightly ML retrain (8 AM)                   ║
║  Poller     → 9 new sources (USGS+ · PORTS · NWS ·       ║
║               ERDDAP · EPA · GCOOS · HAB · AIS · USACE)  ║
║  ML vector  → 152 features from 24+ live data sources    ║
║  Phase 1+2 active — Logistic + Random Forest + SHAP      ║
║  Phase 3 pre-wired — Vertex AI CNN-LSTM on threshold     ║
║  Products   → Flood · Beach · Climate · Pollution        ║
║  "Give the world eyes on its ecosystems."                ║
╚══════════════════════════════════════════════════════════╝
  `)
})

export default app

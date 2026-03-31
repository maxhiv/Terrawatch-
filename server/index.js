import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
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
import { getAllCoopsConditions as getNOAAData } from './services/noaa.js'
import { getCurrentSummary } from './services/hfradar.js'
import { getWeeksBayLatest } from './services/nerrs.js'
import { getMobileAQI } from './services/epa.js'
import { persistTick } from './services/crossSensor.js'
import { retrainHABOracle } from './services/mlTrainer.js'
import { getDBStats, saveDB } from './services/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://terrawatch.io' : '*' }))
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
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'TERRAWATCH',
    intelligence: {
      phase: dbStats?.labeled >= 2000 ? 3 : dbStats?.labeled >= 500 ? 2 : dbStats?.labeled >= 100 ? 1 : 0,
      readings: dbStats?.readings || 0,
      vectors:  dbStats?.vectors  || 0,
      labeled:  dbStats?.labeled  || 0,
      phase3Ready: dbStats?.phase3Ready || false,
    }
  })
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
  app.get('*', (req, res) => res.sendFile(join(__dirname, '../dist/index.html')))
}

let _latestData = {}

cron.schedule('*/3 * * * *', async () => {
  try {
    const [usgs, noaa, hfRadar, nerrs, aqi] = await Promise.allSettled([
      getUSGSData(),
      getNOAAData(),
      getCurrentSummary(),
      getWeeksBayLatest(),
      getMobileAQI(),
    ])

    _latestData = {
      waterQuality: { usgs: usgs.value || [], coops: noaa.value || {} },
      hfRadar:      hfRadar.value,
      nerrs:        nerrs.value,
      aqi:          aqi.value,
    }

    const result = await persistTick(_latestData)
    if (result.ok) {
      console.log(`[CRON] Persisted ${result.readings} readings — labeled: ${result.labeled} (hab:${result.labels?.hab} hypoxia:${result.labels?.hypoxia})`)
    }
  } catch (err) {
    console.error('[CRON] Persist error:', err.message)
  }
})

cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running HAB Oracle assessment...')
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
╔══════════════════════════════════════════════════════╗
║  TERRAWATCH v2.0 — Intelligence Platform             ║
║  Port: ${PORT}                                          ║
║  Phase 1+2 active — SQLite persistence + auto-label  ║
║  Phase 3 pre-wired — Vertex AI CNN-LSTM on threshold ║
║  "Give the world eyes on its ecosystems."            ║
╚══════════════════════════════════════════════════════╝
  `)
})

export default app

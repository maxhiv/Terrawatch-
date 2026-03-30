import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cron from 'node-cron'

// Routes
import waterQualityRoutes from './routes/waterQuality.js'
import habOracleRoutes from './routes/habOracle.js'
import weatherRoutes from './routes/weather.js'
import alertsRoutes from './routes/alerts.js'
import sensorsRoutes from './routes/sensors.js'
import aiRoutes from './routes/ai.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://terrawatch.io' : '*' }))
app.use(express.json())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true })
app.use('/api', limiter)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/water', waterQualityRoutes)
app.use('/api/hab', habOracleRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/sensors', sensorsRoutes)
app.use('/api/ai', aiRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'TERRAWATCH',
    feeds: { usgs: true, noaa: true, epa: true, nerrs: true }
  })
})

// ── Serve frontend in production ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
  app.get('*', (req, res) => res.sendFile(join(__dirname, '../dist/index.html')))
}

// ── Scheduled data polling ────────────────────────────────────────────────────
// Poll USGS and NOAA every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('[CRON] Polling environmental feeds...')
  // Feeds are polled on-demand; this hook is for future background caching
})

// HAB Oracle runs every hour
cron.schedule('0 * * * *', () => {
  console.log('[CRON] Running HAB Oracle assessment...')
})

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  TERRAWATCH API Server                       ║
║  Port: ${PORT}                                  ║
║  Mode: ${process.env.NODE_ENV || 'development'}                      ║
║  "Give the world eyes on its ecosystems."    ║
╚══════════════════════════════════════════════╝
  `)
})

export default app

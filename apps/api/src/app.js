import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

import { applyMiddleware } from './middleware/index.js'

import waterQualityRoutes from './products/core/routes/waterQuality.js'
import habOracleRoutes from './products/core/routes/habOracle.js'
import weatherRoutes from './products/core/routes/weather.js'
import alertsRoutes, { ingestAlerts } from './products/core/routes/alerts.js'
import sensorsRoutes from './products/core/routes/sensors.js'
import aiRoutes from './products/core/routes/ai.js'
import mlRoutes from './products/core/routes/mlArchitecture.js'
import intelligenceRoutes from './products/core/routes/intelligence.js'
import goes19Routes from './products/core/routes/goes19.js'
import floodRoutes from './products/core/routes/flood.js'
import beachRoutes from './products/core/routes/beach.js'
import climateRoutes from './products/core/routes/climate.js'
import pollutionRoutes from './products/core/routes/pollution.js'
import dataSourcesRouter from './products/core/routes/dataSources.js'
import metricsRouter from './products/core/routes/metrics.js'

import { getDBStats } from './data/database.js'
import { getADPHClosures } from './products/core/services/ingest/adph.js'
import { buildFeatureVector } from './products/core/services/features/crossSensor.js'
import { runInference } from './products/core/services/features/mlTrainer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createApp(latestDataRef) {
  const app = express()

  applyMiddleware(app)

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
  app.use('/api/metrics', metricsRouter)

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
          usgs:        (latestDataRef.waterQuality?.usgs?.length  || 0) > 0,
          coops:       Object.keys(latestDataRef.waterQuality?.coops || {}).length > 0,
          nerrs:       latestDataRef.nerrs?.waterQuality?.available ?? false,
          hfRadar:     latestDataRef.hfRadar?.available ?? false,
          aqi:         latestDataRef.aqi?.available ?? false,
          goes_push:   latestDataRef.goesLatest?.sst_gradient != null,
          buoy:        latestDataRef.buoy?.WTMP != null,
          nws_weather: latestDataRef.weather?.current?.wind_speed_mph != null,
        },
        slow: {
          satellite:  latestDataRef.satellite != null,
          ocean:      latestDataRef.ocean     != null,
          ecology:    latestDataRef.ecology   != null,
          land:       latestDataRef.land      != null,
          airplus:    latestDataRef.airplus   != null,
        },
      },
    })
  })

  app.get('/api/goes19/push-latest', (req, res) => {
    res.json(latestDataRef.goesLatest || {})
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
      const vector = buildFeatureVector(latestDataRef)
      const result = await runInference(vector)
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  const distPath = join(__dirname, '../../../dist')
  if (existsSync(join(distPath, 'index.html'))) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
  }

  function getGoesLatest() { return latestDataRef.goesLatest || {} }
  app.locals.getGoesLatest = getGoesLatest
  app.locals.getLatestData = () => latestDataRef

  return { app, ingestAlerts }
}

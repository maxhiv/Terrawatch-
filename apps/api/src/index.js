import cron from 'node-cron'
import { PORT } from './config/env.js'
import { createApp } from './app.js'
import { startPoller, pollerEvents } from './jobs/dataSourcePoller.js'
import { invalidateMetricsCache } from './products/core/routes/metrics.js'

import { getRealtimeData as getUSGSData } from './products/core/services/ingest/usgs.js'
import { getAllCoopsConditions as getNOAAData, getBuoyData, getMobileWeather } from './products/core/services/ingest/noaa.js'
import { getCurrentSummary } from './products/core/services/ingest/hfradar.js'
import { getWeeksBayLatest } from './products/core/services/ingest/nerrs.js'
import { getMobileAQI, getWQPDO2 } from './products/core/services/ingest/epa.js'
import { getAllSatelliteStatus } from './products/core/services/ingest/satellite.js'
import { getAllOceanStatus } from './products/core/services/ingest/ocean.js'
import { getAllEcologyStatus } from './products/core/services/ingest/ecology.js'
import { getAllLandRegWeatherStatus } from './products/core/services/ingest/landregweather.js'
import { getAllAirQualityStatus } from './products/core/services/ingest/airplus.js'
import { persistTick, buildFeatureVector } from './products/core/services/features/crossSensor.js'
import { retrainHABOracle, backfillUnlabeledVectors } from './products/core/services/features/mlTrainer.js'
import { getDBStats, saveDB, getLatestGOESReadings, writeSourceHealth, getLatestSnapshots } from './data/database.js'
import { FEATURE_KEYS } from './ml/shared/featureVector.js'

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

const { app, ingestAlerts } = createApp(_latestData)

async function evaluateAndDispatchAlerts(features) {
  const alerts = []
  if (features.min_do2 != null && features.min_do2 < 3.0) {
    alerts.push({ type: 'hypoxia', severity: 'critical', message: `DO\u2082 critically low: ${features.min_do2.toFixed(1)} mg/L`, value: features.min_do2, source: 'cron_ml' })
  } else if (features.min_do2 != null && features.min_do2 < 5.0) {
    alerts.push({ type: 'hypoxia', severity: 'warning', message: `DO\u2082 below stress threshold: ${features.min_do2.toFixed(1)} mg/L`, value: features.min_do2, source: 'cron_ml' })
  }
  if (features.goes_stratification_alert) {
    alerts.push({ type: 'stratification', severity: 'warning', message: `GOES-19 SST gradient: ${features.goes_sst_gradient?.toFixed(1)}\u00b0C/km \u2014 stratification alert`, value: features.goes_sst_gradient, source: 'cron_ml' })
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
    alerts.push({ type: 'air_quality', severity: 'warning', message: 'PM2.5 exceeds 35 \u00b5g/m\u00b3', value: features.openaq_pm25 || features.purpleair_pm25, source: 'cron_ml' })
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

    Object.assign(_latestData, {
      waterQuality: usgs.status === 'fulfilled' && noaa.status === 'fulfilled'
        ? { usgs: usgs.value || [], coops: noaa.value || {} }
        : {
            usgs:  usgs.status  === 'fulfilled' ? (usgs.value || []) : (_latestData.waterQuality?.usgs || []),
            coops: noaa.status  === 'fulfilled' ? (noaa.value || {}) : (_latestData.waterQuality?.coops || {}),
          },
      hfRadar:    hfRadar.status    === 'fulfilled' ? (hfRadar.value    ?? null) : _latestData.hfRadar,
      nerrs:      nerrs.status      === 'fulfilled' ? (nerrs.value      ?? null) : _latestData.nerrs,
      nerrsSecondary: nerrs.status  === 'fulfilled' ? (nerrs.value?.secondary ?? null) : _latestData.nerrsSecondary,
      aqi:        aqi.status        === 'fulfilled' ? (aqi.value        ?? null) : _latestData.aqi,
      goesLatest: goesLatest.status === 'fulfilled' ? (goesLatest.value ?? null) : _latestData.goesLatest,
      buoy:       buoy.status       === 'fulfilled' ? (buoy.value       ?? null) : _latestData.buoy,
      weather:    weather.status    === 'fulfilled' ? (weather.value    ?? null) : _latestData.weather,
    })

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
        result.goesFeatures && '\u2713GOES',
        _latestData.buoy?.WTMP != null && '\u2713buoy',
        _latestData.weather?.current?.wind_speed_mph != null && '\u2713NWS',
        _latestData.ecology && '\u2713eco',
        _latestData.satellite && '\u2713sat',
        _latestData.land && '\u2713land',
        _latestData.airplus && '\u2713air',
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
    console.log('[CRON:20m] Fetching mid-tier sources: satellite \u00b7 ocean \u00b7 ecology \u00b7 airplus \u00b7 WQP')
    const startMs = Date.now()

    const [satellite, ocean, ecology, airplus, wqpDO2] = await Promise.allSettled([
      getAllSatelliteStatus(),
      getAllOceanStatus(),
      getAllEcologyStatus(),
      getAllAirQualityStatus(),
      getWQPDO2(),
    ])

    Object.assign(_latestData, {
      satellite: satellite.status === 'fulfilled' ? satellite.value : _latestData.satellite,
      ocean:     ocean.status     === 'fulfilled' ? ocean.value     : _latestData.ocean,
      ecology:   ecology.status   === 'fulfilled' ? ecology.value   : _latestData.ecology,
      airplus:   airplus.status   === 'fulfilled' ? airplus.value   : _latestData.airplus,
      wqpDO2:    wqpDO2.status    === 'fulfilled' ? (wqpDO2.value   ?? null) : _latestData.wqpDO2,
    })

    const connected = [
      satellite.status === 'fulfilled' && 'satellite',
      ocean.status     === 'fulfilled' && 'ocean',
      ecology.status   === 'fulfilled' && 'ecology',
      airplus.status   === 'fulfilled' && 'airplus',
      wqpDO2.status    === 'fulfilled' && wqpDO2.value != null && 'wqp_do2',
    ].filter(Boolean)

    const latencyMs = Date.now() - startMs
    try { await writeSourceHealth('mid_cron', 'ok', latencyMs, connected.length) } catch (shErr) { console.warn('[SourceHealth] write error:', shErr.message) }
    console.log(`[CRON:20m] Updated: ${connected.join(' \u00b7 ')} | ${latencyMs}ms`)
  } catch (err) {
    console.error('[CRON:20m] Error:', err.message)
  }
})

cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('[CRON:6h] Fetching slow-tier sources: land-reg \u00b7 weather baselines')
    const startMs = Date.now()

    const [land] = await Promise.allSettled([
      getAllLandRegWeatherStatus(),
    ])

    Object.assign(_latestData, {
      land: land.status === 'fulfilled' ? land.value : _latestData.land,
    })

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
      console.log('[Intelligence] *** PHASE 3 READY \u2014 Add GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY to activate CNN-LSTM training ***')
    }
  } catch (statErr) {
    console.warn('[Intelligence] Stats unavailable:', statErr.message)
  }
}, 3000)

app.listen(PORT, () => {
  startPoller()
  pollerEvents.on('snapshot', () => invalidateMetricsCache())
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  TERRAWATCH v2.2 \u2014 Full-Stack Intelligence Platform      \u2551
\u2551  Port: ${PORT}                                              \u2551
\u2551  CRON 3min  \u2192 USGS \u00b7 CO-OPS \u00b7 NERRS \u00b7 HFRadar \u00b7 GOES-DB \u2551
\u2551               NDBC Buoy \u00b7 NWS Weather \u00b7 AirNow           \u2551
\u2551  CRON 20min \u2192 Satellite \u00b7 Ocean \u00b7 Ecology \u00b7 AirPlus      \u2551
\u2551  CRON 6hr   \u2192 Land-Reg \u00b7 AHPS \u00b7 NCEI \u00b7 SSURGO \u00b7 FEMA    \u2551
\u2551  CRON daily \u2192 Nightly ML retrain (8 AM)                   \u2551
\u2551  Poller     \u2192 9 new sources (USGS+ \u00b7 PORTS \u00b7 NWS \u00b7       \u2551
\u2551               ERDDAP \u00b7 EPA \u00b7 GCOOS \u00b7 HAB \u00b7 AIS \u00b7 USACE)  \u2551
\u2551  ML vector  \u2192 ${FEATURE_KEYS.length} features from 24+ live data sources    \u2551
\u2551  Phase 1+2 active \u2014 Logistic + Random Forest + SHAP      \u2551
\u2551  Phase 3 pre-wired \u2014 Vertex AI CNN-LSTM on threshold     \u2551
\u2551  Products   \u2192 Flood \u00b7 Beach \u00b7 Climate \u00b7 Pollution        \u2551
\u2551  "Give the world eyes on its ecosystems."                \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d
  `)
})

export default app

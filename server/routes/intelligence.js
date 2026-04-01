import express from 'express'
import {
  getDBStats, getHistory, getLabeledVectors, getRecentEvents,
  getModelHistory, getAllVectors, getUnexportedVectors, markVectorsExported
} from '../services/database.js'
import { retrainHABOracle, runInference, PHASE_THRESHOLDS } from '../services/mlTrainer.js'
import { buildFeatureVector, autoLabel, THRESHOLDS } from '../services/crossSensor.js'

const router = express.Router()

router.get('/live-vector', async (req, res) => {
  try {
    const getData = req.app.locals.getLatestData
    const data = getData ? getData() : {}
    const vector = buildFeatureVector(data)
    res.json({ vector, keyCount: Object.keys(vector).length, nonNull: Object.values(vector).filter(v => v != null).length })
  } catch (err) {
    res.json({ error: err.message, vector: {} })
  }
})

router.get('/status', async (req, res) => {
  try {
    const [stats, models, events] = await Promise.all([
      getDBStats(),
      getModelHistory(5),
      getRecentEvents(10),
    ])

    res.json({
      database:  stats,
      models,
      recentEvents: events,
      phases: {
        current: stats.labeled >= PHASE_THRESHOLDS.cnnLstm ? 3
               : stats.labeled >= PHASE_THRESHOLDS.forest  ? 2
               : stats.labeled >= PHASE_THRESHOLDS.logistic ? 1
               : 0,
        thresholds: PHASE_THRESHOLDS,
        thresholds_description: {
          0: 'Accumulating data — no model yet',
          1: `Logistic regression (${PHASE_THRESHOLDS.logistic}+ labeled samples)`,
          2: `Random forest (${PHASE_THRESHOLDS.forest}+ samples)`,
          3: `CNN-LSTM on Vertex AI (${PHASE_THRESHOLDS.cnnLstm}+ samples)`,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/retrain', async (req, res) => {
  try {
    console.log('[Intelligence] Manual retrain triggered')
    const result = await retrainHABOracle()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/inference', async (req, res) => {
  try {
    const features = req.body?.features || {}
    const result = await runInference(features)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/history/:station/:param', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 168
    const data = await getHistory(req.params.station, req.params.param, hours)
    res.json({ station: req.params.station, param: req.params.param, hours, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/vectors', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
    const labeled = req.query.labeled === 'true'
    const data = labeled ? await getLabeledVectors(limit) : await getAllVectors(limit)
    const parsed = data.map(v => ({
      ...v,
      features: typeof v.features === 'string' ? JSON.parse(v.features) : v.features,
    }))
    res.json({ count: parsed.length, vectors: parsed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/events', async (req, res) => {
  try {
    const events = await getRecentEvents(parseInt(req.query.limit) || 50)
    res.json({ events, count: events.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/export-training-data', async (req, res) => {
  try {
    const vectors = await getUnexportedVectors(5000)
    if (!vectors.length) return res.json({ message: 'No unexported vectors', count: 0 })

    const jsonl = vectors.map(v => {
      const features = typeof v.features === 'string' ? JSON.parse(v.features) : v.features
      return JSON.stringify({
        ts: v.ts,
        features,
        label_hab:      v.label_hab,
        label_hypoxia:  v.label_hypoxia,
      })
    }).join('\n')

    await markVectorsExported(vectors.map(v => v.id))

    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Content-Disposition', `attachment; filename=terrawatch_training_${Date.now()}.jsonl`)
    res.send(jsonl)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/models', async (req, res) => {
  try {
    const history = await getModelHistory(20)
    res.json({ models: history, count: history.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/thresholds', (req, res) => {
  res.json({ thresholds: THRESHOLDS, phaseThresholds: PHASE_THRESHOLDS })
})

export default router

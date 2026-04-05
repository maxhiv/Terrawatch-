import express from 'express'
import { DATA_SOURCES, computeHABRiskScore } from '../services/dataSources/index.js'
import { triggerSourceRefresh, pollerEvents } from '../jobs/dataSourcePoller.js'
import {
  getLatestSnapshots,
  getLatestSnapshotForSource,
  getSnapshotHistory,
  getRecentRiskFlags,
  getHABRiskHistory,
} from '../services/database.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    sources: DATA_SOURCES.map(s => ({
      id:                s.id,
      label:             s.label,
      category:          s.category,
      description:       s.description,
      provider:          s.provider,
      poll_interval_min: s.poll_interval_min,
      free:              s.free,
      key_required:      s.key_required ?? null,
    })),
  })
})

router.get('/latest', async (req, res) => {
  try {
    const snapshots = await getLatestSnapshots()
    const flags     = await getRecentRiskFlags(6)

    res.json({
      timestamp:       new Date().toISOString(),
      snapshots,
      active_flags:    flags,
      hab_risk_score:  computeHABRiskScore(flags.map(f => ({ flag: f.flag }))),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/risk/score', async (req, res) => {
  try {
    const flags   = await getRecentRiskFlags(6)
    const history = await getHABRiskHistory(72)
    const score   = computeHABRiskScore(flags.map(f => ({ flag: f.flag })))

    res.json({
      score,
      level:   riskLevel(score),
      flags:   flags.slice(0, 30),
      history,
      updated: new Date().toISOString(),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/risk/flags', async (req, res) => {
  const hours = parseInt(req.query.hours) || 24
  try {
    const flags = await getRecentRiskFlags(Math.min(hours, 168))
    res.json({ flags, count: flags.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 25000)

  const onUpdate  = snap  => send('source_update', snap)
  const onFlags   = ev    => send('flags_raised', ev)
  const onSnap    = snap  => send('snapshot', snap)
  const onError   = ev    => send('source_error', ev)

  pollerEvents.on('source_update', onUpdate)
  pollerEvents.on('flags_raised',  onFlags)
  pollerEvents.on('snapshot',      onSnap)
  pollerEvents.on('source_error',  onError)

  req.on('close', () => {
    clearInterval(heartbeat)
    pollerEvents.off('source_update', onUpdate)
    pollerEvents.off('flags_raised',  onFlags)
    pollerEvents.off('snapshot',      onSnap)
    pollerEvents.off('source_error',  onError)
  })
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const source = DATA_SOURCES.find(s => s.id === id)
  if (!source) return res.status(404).json({ error: `Unknown source: ${id}` })

  try {
    const snapshot = await getLatestSnapshotForSource(id)
    res.json({ source_id: id, label: source.label, category: source.category, snapshot })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/history', async (req, res) => {
  const { id }    = req.params
  const hours     = parseInt(req.query.hours) || 24
  const source    = DATA_SOURCES.find(s => s.id === id)
  if (!source) return res.status(404).json({ error: `Unknown source: ${id}` })

  try {
    const history = await getSnapshotHistory(id, Math.min(hours, 168))
    res.json({ source_id: id, hours, history })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/refresh', async (req, res) => {
  const { id } = req.params
  try {
    await triggerSourceRefresh(id)
    const snapshot = await getLatestSnapshotForSource(id)
    res.json({ triggered: true, snapshot })
  } catch (err) {
    res.status(err.message.includes('Unknown') ? 404 : 500).json({ error: err.message })
  }
})

function riskLevel(score) {
  if (score >= 70) return 'CRITICAL'
  if (score >= 45) return 'HIGH'
  if (score >= 25) return 'MODERATE'
  if (score >= 10) return 'LOW'
  return 'MINIMAL'
}

export default router

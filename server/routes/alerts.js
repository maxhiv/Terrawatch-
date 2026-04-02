import express from 'express'
const router = express.Router()

const DEDUP_WINDOW_MS = 10 * 60 * 1000

let activeAlerts = []
let alertHistory = []

function dedupKey(alert) {
  return `${alert.type}:${alert.severity}`
}

function ingestAlerts(newAlerts) {
  const now = Date.now()
  const added = []
  for (const a of newAlerts) {
    const key = dedupKey(a)
    const recent = activeAlerts.find(
      existing => dedupKey(existing) === key && (now - new Date(existing.timestamp).getTime()) < DEDUP_WINDOW_MS
    )
    if (recent) continue
    const alert = {
      id: `ALT-${now}-${Math.random().toString(36).slice(2, 6)}`,
      type: a.type,
      severity: a.severity,
      message: a.message,
      value: a.value ?? null,
      source: a.source || 'cron',
      timestamp: new Date(a.ts || now).toISOString(),
      acknowledged: false,
    }
    activeAlerts.push(alert)
    alertHistory.push(alert)
    added.push(alert)
    console.log(`[ALERT] ${alert.severity} — ${alert.message}`)
  }
  if (alertHistory.length > 200) alertHistory = alertHistory.slice(-100)
  return added
}

router.get('/', (req, res) => {
  res.json({
    active: activeAlerts,
    history: alertHistory.slice(-20),
    count: activeAlerts.length,
    timestamp: new Date().toISOString(),
  })
})

router.get('/ml', (req, res) => {
  res.json({
    alerts: activeAlerts,
    count: activeAlerts.length,
    timestamp: new Date().toISOString(),
  })
})

router.post('/trigger', (req, res) => {
  const { type, severity, message, source, data } = req.body
  const added = ingestAlerts([{ type, severity, message, source, value: data }])
  res.json({ alert: added[0] || null, status: added.length ? 'dispatched' : 'deduped' })
})

router.put('/:id/acknowledge', (req, res) => {
  const alert = activeAlerts.find(a => a.id === req.params.id)
  if (!alert) return res.status(404).json({ error: 'Alert not found' })
  alert.acknowledged = true
  alert.acknowledgedAt = new Date().toISOString()
  activeAlerts = activeAlerts.filter(a => !a.acknowledged)
  res.json({ alert })
})

export { ingestAlerts }
export default router

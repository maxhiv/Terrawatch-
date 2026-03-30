import express from 'express'
const router = express.Router()

let activeAlerts = []
let alertHistory = []

router.get('/', (req, res) => {
  res.json({ active: activeAlerts, history: alertHistory.slice(-20), count: activeAlerts.length })
})

router.post('/trigger', (req, res) => {
  const { type, severity, message, source, data } = req.body
  const alert = {
    id: `ALT-${Date.now()}`,
    type, severity, message, source,
    data: data || {},
    timestamp: new Date().toISOString(),
    acknowledged: false,
  }
  activeAlerts.push(alert)
  alertHistory.push(alert)
  console.log(`[ALERT] ${severity} — ${message}`)
  res.json({ alert, status: 'dispatched' })
})

router.put('/:id/acknowledge', (req, res) => {
  const alert = activeAlerts.find(a => a.id === req.params.id)
  if (!alert) return res.status(404).json({ error: 'Alert not found' })
  alert.acknowledged = true
  alert.acknowledgedAt = new Date().toISOString()
  activeAlerts = activeAlerts.filter(a => !a.acknowledged)
  res.json({ alert })
})

export default router

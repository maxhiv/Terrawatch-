import express from 'express'
import { getMobileWeather, getActiveAlerts } from '../services/noaa.js'
const router = express.Router()

router.get('/current', async (req, res) => {
  try {
    const data = await getMobileWeather()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await getActiveAlerts()
    res.json({ alerts, count: alerts.length, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

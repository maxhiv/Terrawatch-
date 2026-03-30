import express from 'express'
import { getRealtimeData, getHistoricalData, MOBILE_BAY_STATIONS } from '../services/usgs.js'
import { getAllCoopsConditions, getBuoyData } from '../services/noaa.js'

const router = express.Router()

router.get('/realtime', async (req, res) => {
  try {
    const [usgs, coops, buoy] = await Promise.all([
      getRealtimeData(),
      getAllCoopsConditions(),
      getBuoyData('42012'),
    ])
    res.json({ usgs, coops, buoy, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/stations', (req, res) => {
  res.json({ stations: MOBILE_BAY_STATIONS })
})

router.get('/historical/:siteNo/:paramCode', async (req, res) => {
  try {
    const { siteNo, paramCode } = req.params
    const days = parseInt(req.query.days) || 7
    const data = await getHistoricalData(siteNo, paramCode, days)
    res.json({ data, siteNo, paramCode, days })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

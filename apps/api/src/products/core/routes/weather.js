import express from 'express'
import { getMobileWeather, getActiveAlerts } from '../services/ingest/noaa.js'
const router = express.Router()

router.get('/current', async (req, res) => {
  try {
    const data = await getMobileWeather()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/forecast', async (req, res) => {
  try {
    const getData = req.app.locals.getLatestData
    const cached = getData ? getData() : {}
    const openMeteo = cached.land?.openMeteo || {}
    const nws = cached.weather || {}

    const forecast = {
      current: {
        temp_f: nws.current?.temp_f ?? null,
        temp_c: nws.current?.temp_c ?? null,
        humidity: nws.current?.humidity ?? null,
        wind_speed_mph: nws.current?.wind_speed_mph ?? null,
        wind_direction: nws.current?.wind_direction ?? null,
        conditions: nws.current?.conditions ?? null,
      },
      hourly: openMeteo.hourlyForecast?.slice(0, 24) ?? [],
      daily: openMeteo.dailyForecast?.slice(0, 7) ?? [],
      source: {
        current: nws.available ? 'NWS Mobile' : 'unavailable',
        forecast: openMeteo.available ? 'Open-Meteo' : 'unavailable',
      },
      timestamp: new Date().toISOString(),
    }
    res.json(forecast)
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

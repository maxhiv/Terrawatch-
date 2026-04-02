import express from 'express'
import { getADPHClosures } from '../services/adph.js'

const router = express.Router()

router.get('/status', async (req, res) => {
  const getData = req.app.locals.getLatestData
  const data = getData ? getData() : {}

  const safeNum = v => { if (v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n }

  const waterTemp = safeNum(data.waterQuality?.coops?.['8735180']?.water_temperature) ?? safeNum(data.buoy?.WTMP)
  const windMph = safeNum(data.weather?.current?.wind_speed_mph) ?? 0
  const windGust = safeNum(data.weather?.current?.wind_gust_mph) ?? 0
  const uvIndex = safeNum(data.land?.openMeteo?.current?.uv_index) ?? 0
  const waveHeight = safeNum(data.buoy?.WVHT)
  const aqi = safeNum(data.aqi?.readings?.[0]?.aqi) ?? 0
  const hfSpeed = safeNum(data.hfRadar?.avgSpeed_ms) ?? 0
  const hfDir = data.hfRadar?.directionCardinal ?? null

  const adph = await getADPHClosures()

  const swimSafety = (() => {
    let score = 100
    if (waveHeight != null && waveHeight > 1.5) score -= 30
    else if (waveHeight != null && waveHeight > 0.8) score -= 15
    if (windMph > 20) score -= 25
    else if (windMph > 15) score -= 10
    if (hfSpeed > 0.5) score -= 20
    if (uvIndex > 8) score -= 10
    if (aqi > 100) score -= 15
    return Math.max(0, score)
  })()

  res.json({
    swimSafety: {
      score: swimSafety,
      level: swimSafety >= 75 ? 'GOOD' : swimSafety >= 50 ? 'MODERATE' : swimSafety >= 25 ? 'CAUTION' : 'DANGEROUS',
    },
    conditions: {
      waterTemp_c: waterTemp,
      waterTemp_f: waterTemp != null ? Math.round(waterTemp * 9/5 + 32) : null,
      wind_mph: windMph,
      wind_gust_mph: windGust,
      uv_index: uvIndex,
      wave_height_m: waveHeight,
      aqi,
      current_speed_ms: hfSpeed,
      current_direction: hfDir,
    },
    shellfishClosures: adph,
    beaches: [
      { name: 'Dauphin Island West End', type: 'Gulf beach', waterTemp: waterTemp },
      { name: 'Gulf Shores', type: 'Gulf beach', waterTemp: waterTemp },
      { name: 'Fairhope Municipal Pier', type: 'Bay beach', waterTemp: waterTemp },
      { name: 'Daphne Bayfront Park', type: 'Bay beach', waterTemp: waterTemp },
    ],
    timestamp: new Date().toISOString(),
  })
})

export default router

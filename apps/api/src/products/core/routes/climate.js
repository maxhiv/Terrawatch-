import express from 'express'

const router = express.Router()

router.get('/status', (req, res) => {
  const getData = req.app.locals.getLatestData
  const data = getData ? getData() : {}

  const safeNum = v => { if (v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n }

  const usgs = data.waterQuality?.usgs || []
  const do2Vals = usgs.map(s => safeNum(s.readings?.do_mg_l?.value ?? s.readings?.do_mg_l)).filter(v => v != null)
  const tempVals = usgs.map(s => safeNum(s.readings?.water_temp_c?.value ?? s.readings?.water_temp_c)).filter(v => v != null)

  const goesSST = safeNum(data.goesLatest?.sst_mean)
  const goesSSTGradient = safeNum(data.goesLatest?.sst_gradient)

  const airTemp = safeNum(data.weather?.current?.temp_c)
  const humidity = safeNum(data.weather?.current?.humidity)
  const slr = safeNum(data.waterQuality?.coops?.['8735180']?.water_level)
  const precipitation = safeNum(data.land?.openMeteo?.current?.precip_mm)

  const heatIndex = (airTemp != null && humidity != null && airTemp > 27)
    ? Math.round(airTemp + 0.33 * (humidity/100 * 6.105 * Math.exp(17.27*airTemp/(237.7+airTemp))) - 4)
    : null

  const vulnerabilityScore = (() => {
    let score = 0
    const avgTemp = tempVals.length ? tempVals.reduce((a,b)=>a+b,0)/tempVals.length : null
    if (avgTemp != null && avgTemp > 30) score += 25
    else if (avgTemp != null && avgTemp > 28) score += 15
    const minDo2 = do2Vals.length ? Math.min(...do2Vals) : null
    if (minDo2 != null && minDo2 < 3) score += 30
    else if (minDo2 != null && minDo2 < 5) score += 15
    if (goesSSTGradient != null && goesSSTGradient > 3.5) score += 20
    if (heatIndex != null && heatIndex > 40) score += 15
    else if (heatIndex != null && heatIndex > 35) score += 10
    if (slr != null && slr > 1.0) score += 10
    return Math.min(100, score)
  })()

  res.json({
    vulnerabilityIndex: vulnerabilityScore,
    riskLevel: vulnerabilityScore >= 65 ? 'HIGH' : vulnerabilityScore >= 35 ? 'MODERATE' : 'LOW',
    indicators: {
      sst: { value: goesSST, gradient: goesSSTGradient, source: 'GOES-19' },
      waterTemp: { avg: tempVals.length ? Math.round(tempVals.reduce((a,b)=>a+b,0)/tempVals.length * 10)/10 : null, count: tempVals.length },
      dissolvedOxygen: { min: do2Vals.length ? Math.min(...do2Vals) : null, avg: do2Vals.length ? Math.round(do2Vals.reduce((a,b)=>a+b,0)/do2Vals.length * 10)/10 : null },
      airTemp: airTemp,
      heatIndex,
      seaLevel: slr,
      precipitation: precipitation,
    },
    trends: {
      note: 'Historical trend analysis requires 30+ days of data accumulation',
      sstTrend: null,
      do2Trend: null,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router

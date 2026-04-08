import express from 'express'

const router = express.Router()

router.get('/status', (req, res) => {
  const getData = req.app.locals.getLatestData
  const data = getData ? getData() : {}

  const landAhps = data.land?.ahps || {}
  const goesQpe = data.goesLatest?.qpe_rainfall ?? null
  const goesQpe6h = data.goesLatest?.qpe_6h ?? null
  const goesQpe24h = data.goesLatest?.qpe_24h ?? null
  const precip7d = data.land?.openMeteo?.dailyForecast
    ? data.land.openMeteo.dailyForecast.slice(0,7).reduce((s,d) => s + (d.precip_sum_mm ?? d.precip_mm ?? 0), 0)
    : null
  const maxPrecipProb = data.land?.openMeteo?.dailyForecast
    ? Math.max(...data.land.openMeteo.dailyForecast.slice(0,7).map(d => d.precipProb ?? 0))
    : null

  const usgs = data.waterQuality?.usgs || []
  const flowValues = usgs.map(s => parseFloat(s.readings?.streamflow_cfs?.value ?? s.readings?.streamflow_cfs)).filter(v => !isNaN(v))
  const totalFlow = flowValues.reduce((a,b) => a+b, 0)
  const gageHeights = usgs.map(s => ({
    station: s.name,
    siteNo: s.siteNo,
    gage_ft: parseFloat(s.readings?.gage_height_ft?.value ?? s.readings?.gage_height_ft) || null,
    flow_cfs: parseFloat(s.readings?.streamflow_cfs?.value ?? s.readings?.streamflow_cfs) || null,
  })).filter(s => s.gage_ft != null || s.flow_cfs != null)

  const compoundRisk = (() => {
    let score = 0
    if (totalFlow > 50000) score += 30
    else if (totalFlow > 20000) score += 15
    if (goesQpe24h != null && goesQpe24h > 25) score += 25
    else if (goesQpe6h != null && goesQpe6h > 5) score += 15
    if (precip7d != null && precip7d > 50) score += 20
    if (landAhps.stage != null && landAhps.stage > 12) score += 25
    else if (landAhps.stage != null && landAhps.stage > 8) score += 10
    return Math.min(100, score)
  })()

  res.json({
    compoundFloodRisk: compoundRisk,
    riskLevel: compoundRisk >= 70 ? 'HIGH' : compoundRisk >= 40 ? 'MODERATE' : 'LOW',
    ahps: {
      stage: landAhps.stage ?? null,
      available: landAhps.available ?? false,
    },
    goes_qpe: { current: goesQpe, h6: goesQpe6h, h24: goesQpe24h },
    precipitation: { sum_7d_mm: precip7d, max_prob_7d: maxPrecipProb },
    riverFlow: { total_cfs: totalFlow, stations: gageHeights },
    forecast: data.land?.openMeteo?.dailyForecast?.slice(0,7).map(d => ({
      date: d.date,
      precip_mm: d.precip_sum_mm ?? d.precip_mm,
      precipProb: d.precipProb,
    })) || [],
    timestamp: new Date().toISOString(),
  })
})

export default router

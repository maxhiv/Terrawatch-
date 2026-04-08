import express from 'express'

const router = express.Router()

router.get('/status', (req, res) => {
  const getData = req.app.locals.getLatestData
  const data = getData ? getData() : {}

  const safeNum = v => { if (v == null) return null; const n = parseFloat(v); return isNaN(n) ? null : n }

  const aqi = safeNum(data.aqi?.readings?.[0]?.aqi) ?? null
  const aqiCategory = data.aqi?.readings?.[0]?.category ?? null
  const openaqPM25 = safeNum(data.airplus?.openAQ?.avgPM25)
  const purpleairPM25 = safeNum(data.airplus?.purpleAir?.avgPM25)
  const epaAqsPM25 = safeNum(data.airplus?.epaAQS?.avgValue)

  const pm25Sources = [openaqPM25, purpleairPM25, epaAqsPM25].filter(v => v != null)
  const avgPM25 = pm25Sources.length ? Math.round(pm25Sources.reduce((a,b)=>a+b,0)/pm25Sources.length * 10)/10 : null

  const usgs = data.waterQuality?.usgs || []
  const turbValues = usgs.map(s => safeNum(s.readings?.turbidity_ntu?.value ?? s.readings?.turbidity_ntu)).filter(v => v != null)
  const orthoPValues = usgs.map(s => safeNum(s.readings?.orthophosphate_mg_l?.value ?? s.readings?.orthophosphate_mg_l)).filter(v => v != null)
  const totalNValues = usgs.map(s => safeNum(s.readings?.total_nitrogen_mg_l?.value ?? s.readings?.total_nitrogen_mg_l)).filter(v => v != null)

  const pollutionIndex = (() => {
    let score = 0
    if (avgPM25 != null && avgPM25 > 35) score += 30
    else if (avgPM25 != null && avgPM25 > 12) score += 15
    if (turbValues.length) {
      const maxTurb = Math.max(...turbValues)
      if (maxTurb > 25) score += 25
      else if (maxTurb > 10) score += 12
    }
    if (orthoPValues.length && Math.max(...orthoPValues) > 0.5) score += 20
    if (totalNValues.length && Math.max(...totalNValues) > 1.5) score += 20
    if (aqi != null && aqi > 100) score += 15
    return Math.min(100, score)
  })()

  res.json({
    pollutionIndex,
    riskLevel: pollutionIndex >= 60 ? 'HIGH' : pollutionIndex >= 30 ? 'MODERATE' : 'LOW',
    airQuality: {
      aqi,
      category: aqiCategory,
      pm25: {
        average: avgPM25,
        sources: {
          openAQ: openaqPM25,
          purpleAir: purpleairPM25,
          epaAQS: epaAqsPM25,
        },
        sourceCount: pm25Sources.length,
      },
    },
    waterQuality: {
      turbidity: {
        max: turbValues.length ? Math.max(...turbValues) : null,
        avg: turbValues.length ? Math.round(turbValues.reduce((a,b)=>a+b,0)/turbValues.length * 10)/10 : null,
        stationCount: turbValues.length,
      },
      nutrients: {
        orthophosphate_max: orthoPValues.length ? Math.max(...orthoPValues) : null,
        totalNitrogen_max: totalNValues.length ? Math.max(...totalNValues) : null,
      },
    },
    npdes: data.epaNpdes || null,
    timestamp: new Date().toISOString(),
  })
})

export default router

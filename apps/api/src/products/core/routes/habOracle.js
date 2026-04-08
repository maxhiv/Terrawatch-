import express from 'express'
import { runHabOracle, runHypoxiaForecast } from '../../../ml/phase1-logreg/habOracle.js'
import { getLatestGOESReadings } from '../../../data/database.js'

const router = express.Router()

router.get('/assess', async (req, res) => {
  try {
    const getData = req.app.locals.getLatestData
    const cached = getData ? getData() : {}

    const usgsArr = cached.waterQuality?.usgs || []
    const coopsObj = cached.waterQuality?.coops || {}
    const weather = cached.weather || {}
    const nerrs = cached.nerrs
    const hfRadar = cached.hfRadar
    const land = cached.land

    let goesPush = cached.goesLatest
    if (!goesPush) {
      try { goesPush = await getLatestGOESReadings() } catch (gErr) { goesPush = null }
    }

    const inputs = extractOracleInputs(
      usgsArr,
      coopsObj,
      weather,
      nerrs,
      hfRadar,
      goesPush,
      null,
      land,
    )
    const habAssessment   = runHabOracle(inputs)
    const hypoxiaAssessment = runHypoxiaForecast(inputs)

    res.json({
      hab:     habAssessment,
      hypoxia: hypoxiaAssessment,
      inputs,
      rawData: {
        usgsStations:   usgsArr.length,
        coopsStations:  Object.keys(coopsObj).length,
        nerrsConnected: nerrs?.waterQuality?.available ?? false,
        nerrsSecondaryConnected: nerrs?.secondary?.available ?? false,
        hfRadarConnected: hfRadar?.available ?? false,
        goesConnected:  goesPush?.sst_gradient != null,
        landConnected:  land?.openMeteo?.available ?? false,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[HAB Oracle]', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/assess', (req, res) => {
  try {
    const inputs = req.body
    const habAssessment = runHabOracle(inputs)
    const hypoxiaAssessment = runHypoxiaForecast(inputs)
    res.json({ hab: habAssessment, hypoxia: hypoxiaAssessment, inputs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function extractOracleInputs(usgsData, coopsData, weather, nerrs, hfRadar, goesPush, goesErddap, land) {
  const safeNum = v => {
    if (v == null) return null
    if (typeof v === 'number') return isNaN(v) ? null : v
    if (typeof v === 'object' && 'value' in v) return safeNum(v.value)
    const n = parseFloat(v); return isNaN(n) ? null : n
  }

  let water_temp_c = null, do_mg_l = null, streamflow_cfs = null,
      turbidity_ntu = null, nitrate_mg_l = null
  const doValues = []

  for (const station of usgsData) {
    const r = station.readings || {}
    if (r.water_temp_c && !water_temp_c)    water_temp_c   = safeNum(r.water_temp_c)
    const stDo = safeNum(r.do_mg_l)
    if (stDo != null) doValues.push(stDo)
    if (stDo != null && do_mg_l == null)    do_mg_l        = stDo
    if (r.streamflow_cfs && !streamflow_cfs) streamflow_cfs = safeNum(r.streamflow_cfs)
    if (r.turbidity_ntu  && !turbidity_ntu)  turbidity_ntu  = safeNum(r.turbidity_ntu)
    if (r.total_nitrogen_mg_l && !nitrate_mg_l) nitrate_mg_l = safeNum(r.total_nitrogen_mg_l)
  }

  const min_do2 = doValues.length > 0 ? Math.min(...doValues) : null

  const dauphinIsland  = coopsData['8735180'] || {}
  const salinity_ppt   = safeNum(dauphinIsland.salinity) ?? null
  const water_level_ft = safeNum(dauphinIsland.water_level) ?? null

  if (!water_temp_c) {
    const coopsStation = Object.values(coopsData).find(s => s.water_temperature?.value)
    if (coopsStation) water_temp_c = ((coopsStation.water_temperature.value - 32) * 5) / 9
  }

  const wind_speed_mph    = weather?.current?.wind_speed_mph  ?? null
  const wind_direction_deg = weather?.current?.wind_direction ?? null

  const wb = nerrs?.waterQuality?.latest || {}
  const chlorophyll_ug_l = safeNum(wb.ChlFluor) ?? null
  const nerrs_do         = safeNum(wb.DO_mgl) ?? null
  const nerrs_sal        = safeNum(wb.Sal) ?? null
  const nerrs_par        = safeNum(wb.PAR) ?? null

  if (!do_mg_l && nerrs_do != null) do_mg_l = nerrs_do

  const wbSecondary = nerrs?.secondary?.latest || {}
  const secondary_do = safeNum(wbSecondary.DO_mgl) ?? null
  if (secondary_do != null) doValues.push(secondary_do)

  const hf_speed_ms     = hfRadar?.avgSpeed_ms ?? null
  const hf_bloom_14h_km = hfRadar?.bloom_transport?.distance_14h_km ?? null

  const goes_sst_gradient = goesPush?.sst_gradient   ?? null
  const goes_qpe_6h       = goesPush?.qpe_6h         ?? null
  const goes_qpe_24h      = goesPush?.qpe_24h        ?? null
  let goes_bloom_index = goesPush?.bloom_index ?? null
  if (goes_bloom_index == null && goesPush?.rgb_ratios != null) {
    try { goes_bloom_index = JSON.parse(goesPush.rgb_ratios)?.bloom_index ?? null } catch (parseErr) { goes_bloom_index = null }
  }
  const goes_glm_flashes  = goesPush?.glm_flashes    ?? null
  const goes_sst_mean     = goesPush?.sst_mean       ?? goesErddap?.latestSST_C ?? null

  const openMeteo = land?.openMeteo?.current || {}
  const par_mmol_m2 = nerrs_par ?? safeNum(openMeteo.solar_rad_wm2)
  const uv_index    = safeNum(openMeteo.uv_index)

  const nwsWaterTemp = safeNum(weather?.current?.temp_c)
  const surfaceTemp = water_temp_c ?? goes_sst_mean ?? nwsWaterTemp
  const bottomTemp = surfaceTemp != null ? surfaceTemp - 2.5 : null
  const surfaceSal = safeNum(nerrs_sal) ?? salinity_ppt
  const bottomSal = surfaceSal != null ? surfaceSal + 3 : null
  const halocline_strength = (bottomSal != null && surfaceSal != null)
    ? bottomSal - surfaceSal
    : null

  return {
    water_temp_c:         water_temp_c ?? goes_sst_mean,
    surface_temp_c:       water_temp_c ?? goes_sst_mean,
    bottom_temp_c:        bottomTemp,
    salinity_ppt:         surfaceSal,
    bottom_salinity_ppt:  bottomSal,
    do_mg_l,
    min_do2,
    streamflow_cfs,
    turbidity_ntu,
    nitrate_mg_l,
    wind_speed_mph,
    wind_direction_deg,
    water_level_ft,
    chlorophyll_ug_l,
    par_mmol_m2,
    uv_index,
    halocline_strength,
    goes_sst_gradient,
    goes_qpe_6h,
    goes_qpe_24h,
    goes_bloom_index,
    goes_glm_flashes,
    hf_speed_ms,
    hf_bloom_14h_km,
  }
}

export default router

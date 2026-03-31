import express from 'express'
import { runHabOracle, runHypoxiaForecast } from '../ml/habOracle.js'
import { getRealtimeData } from '../services/usgs.js'
import { getAllCoopsConditions, getMobileWeather } from '../services/noaa.js'
import { getWeeksBayLatest } from '../services/nerrs.js'
import { getCurrentSummary } from '../services/hfradar.js'
import { getGOES19Status } from '../services/goes.js'
import { getLatestGOESReadings } from '../services/database.js'

const router = express.Router()

router.get('/assess', async (req, res) => {
  try {
    const [usgsData, coopsData, weather, nerrs, hfRadar, goesPush, goesErddap] = await Promise.allSettled([
      getRealtimeData(),
      getAllCoopsConditions(),
      getMobileWeather(),
      getWeeksBayLatest(),
      getCurrentSummary(),
      getLatestGOESReadings(),
      getGOES19Status(),
    ])

    const inputs = extractOracleInputs(
      usgsData.value   || [],
      coopsData.value  || {},
      weather.value    || {},
      nerrs.value,
      hfRadar.value,
      goesPush.value,
      goesErddap.value,
    )
    const habAssessment   = runHabOracle(inputs)
    const hypoxiaAssessment = runHypoxiaForecast(inputs)

    res.json({
      hab:     habAssessment,
      hypoxia: hypoxiaAssessment,
      inputs,
      rawData: {
        usgsStations:   (usgsData.value  || []).length,
        coopsStations:  Object.keys(coopsData.value || {}).length,
        nerrsConnected: nerrs.value?.waterQuality?.available ?? false,
        hfRadarConnected: hfRadar.value?.available ?? false,
        goesConnected:  goesPush.value?.sst_gradient != null,
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

function extractOracleInputs(usgsData, coopsData, weather, nerrs, hfRadar, goesPush, goesErddap) {
  // ── USGS NWIS ──────────────────────────────────────────────────────────────
  let water_temp_c = null, do_mg_l = null, streamflow_cfs = null,
      turbidity_ntu = null, nitrate_mg_l = null

  for (const station of usgsData) {
    if (station.readings?.water_temp_c && !water_temp_c)  water_temp_c   = station.readings.water_temp_c.value
    if (station.readings?.do_mg_l      && !do_mg_l)       do_mg_l        = station.readings.do_mg_l.value
    if (station.readings?.streamflow_cfs && !streamflow_cfs) streamflow_cfs = station.readings.streamflow_cfs.value
    if (station.readings?.turbidity_ntu  && !turbidity_ntu)  turbidity_ntu  = station.readings.turbidity_ntu.value
    if (station.readings?.total_nitrogen_mg_l && !nitrate_mg_l) nitrate_mg_l = station.readings.total_nitrogen_mg_l.value
  }

  // ── NOAA CO-OPS ────────────────────────────────────────────────────────────
  const dauphinIsland  = coopsData['8735180'] || {}
  const salinity_ppt   = dauphinIsland.salinity?.value ?? null
  const water_level_ft = dauphinIsland.water_level?.value ?? null

  // Fallback surface temp from CO-OPS if USGS has none
  if (!water_temp_c) {
    const coopsStation = Object.values(coopsData).find(s => s.water_temperature?.value)
    if (coopsStation) water_temp_c = ((coopsStation.water_temperature.value - 32) * 5) / 9
  }

  // ── NWS Weather ────────────────────────────────────────────────────────────
  const wind_speed_mph    = weather?.current?.wind_speed_mph  ?? null
  const wind_direction_deg = weather?.current?.wind_direction ?? null

  // ── NERRS Weeks Bay ────────────────────────────────────────────────────────
  const wb = nerrs?.waterQuality?.latest || {}
  const chlorophyll_ug_l = wb.ChlFluor?.value ?? null     // was hardcoded null — now live
  const nerrs_do         = wb.DO_mgl?.value   ?? null
  const nerrs_sal        = wb.Sal?.value      ?? null
  const nerrs_turb       = wb.Turb?.value     ?? null

  // Use NERRS DO as tiebreaker if USGS is missing
  if (!do_mg_l && nerrs_do != null) do_mg_l = nerrs_do
  // Use NERRS salinity if CO-OPS Dauphin Island is missing
  if (!salinity_ppt && nerrs_sal != null) { /* pass through as separate field only */ }

  // ── HF Radar ───────────────────────────────────────────────────────────────
  const hf_speed_ms     = hfRadar?.avgSpeed_ms ?? null
  const hf_bloom_14h_km = hfRadar?.bloom_transport?.distance_14h_km ?? null

  // ── GOES-19 push data (from DB) ────────────────────────────────────────────
  const goes_sst_gradient = goesPush?.sst_gradient   ?? null
  const goes_qpe_6h       = goesPush?.qpe_6h         ?? null
  const goes_qpe_24h      = goesPush?.qpe_24h        ?? null
  const goes_bloom_index  = goesPush?.rgb_ratios != null
    ? JSON.parse(goesPush.rgb_ratios)?.bloom_index ?? null
    : null
  const goes_glm_flashes  = goesPush?.glm_flashes    ?? null
  const goes_sst_mean     = goesPush?.sst_mean       ?? goesErddap?.latestSST_C ?? null

  return {
    // Legacy fields (HAB Oracle v1 compatibility)
    water_temp_c:         water_temp_c ?? goes_sst_mean,
    surface_temp_c:       water_temp_c ?? goes_sst_mean,
    bottom_temp_c:        water_temp_c ? water_temp_c - 2.5 : null,
    salinity_ppt,
    bottom_salinity_ppt:  salinity_ppt ? salinity_ppt + 3 : null,
    do_mg_l,
    streamflow_cfs,
    turbidity_ntu,
    nitrate_mg_l,
    wind_speed_mph,
    wind_direction_deg,
    water_level_ft,
    chlorophyll_ug_l,     // NERRS ChlFluor — no longer null
    // Extended fields for v2 risk functions
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

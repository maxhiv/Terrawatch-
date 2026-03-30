// server/routes/habOracle.js
import express from 'express'
import { runHabOracle, runHypoxiaForecast } from '../ml/habOracle.js'
import { getRealtimeData } from '../services/usgs.js'
import { getAllCoopsConditions, getMobileWeather } from '../services/noaa.js'

const router = express.Router()

// Aggregate real sensor data and run HAB Oracle
router.get('/assess', async (req, res) => {
  try {
    const [usgsData, coopsData, weather] = await Promise.all([
      getRealtimeData(),
      getAllCoopsConditions(),
      getMobileWeather(),
    ])

    // Extract best available readings for Oracle inputs
    const inputs = extractOracleInputs(usgsData, coopsData, weather)
    const habAssessment = runHabOracle(inputs)
    const hypoxiaAssessment = runHypoxiaForecast(inputs)

    res.json({
      hab: habAssessment,
      hypoxia: hypoxiaAssessment,
      inputs,
      rawData: { usgsStations: usgsData.length, coopsStations: Object.keys(coopsData).length },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[HAB Oracle]', err)
    res.status(500).json({ error: err.message })
  }
})

// Manual assessment with provided inputs
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

function extractOracleInputs(usgsData, coopsData, weather) {
  // Find best water temperature reading
  let water_temp_c = null
  for (const station of usgsData) {
    if (station.readings?.water_temp_c) {
      water_temp_c = station.readings.water_temp_c.value
      break
    }
  }
  // Fall back to CO-OPS
  if (!water_temp_c) {
    const coopsStation = Object.values(coopsData).find(s => s.water_temperature?.value)
    if (coopsStation) water_temp_c = ((coopsStation.water_temperature.value - 32) * 5) / 9
  }

  // Salinity from CO-OPS (Dauphin Island most reliable)
  const dauphinIsland = coopsData['8735180']
  const salinity_ppt = dauphinIsland?.salinity?.value || null

  // Water level for tidal state
  const water_level_ft = dauphinIsland?.water_level?.value || null

  // DO from USGS
  let do_mg_l = null, streamflow_cfs = null, turbidity_ntu = null, nitrate_mg_l = null
  for (const station of usgsData) {
    if (station.readings?.do_mg_l && !do_mg_l) do_mg_l = station.readings.do_mg_l.value
    if (station.readings?.streamflow_cfs && !streamflow_cfs) streamflow_cfs = station.readings.streamflow_cfs.value
    if (station.readings?.turbidity_ntu && !turbidity_ntu) turbidity_ntu = station.readings.turbidity_ntu.value
    if (station.readings?.total_nitrogen_mg_l && !nitrate_mg_l) nitrate_mg_l = station.readings.total_nitrogen_mg_l.value
  }

  // Wind from NWS
  const wind_speed_mph = weather?.current?.wind_speed_mph || null
  const wind_direction_deg = weather?.current?.wind_direction || null

  return {
    water_temp_c,
    surface_temp_c: water_temp_c,
    bottom_temp_c: water_temp_c ? water_temp_c - 2.5 : null, // estimated
    salinity_ppt,
    bottom_salinity_ppt: salinity_ppt ? salinity_ppt + 3 : null, // estimated halocline
    do_mg_l,
    streamflow_cfs,
    turbidity_ntu,
    nitrate_mg_l,
    wind_speed_mph,
    wind_direction_deg,
    water_level_ft,
    chlorophyll_ug_l: null, // requires MODIS/PACE integration
  }
}

export default router

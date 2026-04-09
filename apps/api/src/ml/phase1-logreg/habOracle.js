/**
 * TERRAWATCH HAB Oracle v2.0
 * Pre-bloom Harmful Algal Bloom prediction for Mobile Bay
 */

const THRESHOLDS = {
  TEMP_OPTIMAL_MIN: 22,
  TEMP_OPTIMAL_MAX: 30,
  SALINITY_MIN: 25,
  SALINITY_MAX: 37,
  DO_RISK_LOW: 5.0,
  DO_RISK_CRITICAL: 3.0,
  WIND_CALM_THRESHOLD: 5,
  WIND_ONSHORE_DEGREES: 180,
  TURBIDITY_HIGH: 10,
  NUTRIENT_HIGH_N: 1.5,
  CHLOROPHYLL_ANOMALY: 1.5,
}

const SEASONAL_BLOOM_RISK = {
  1: 0.05, 2: 0.05, 3: 0.10, 4: 0.15,
  5: 0.25, 6: 0.35, 7: 0.55, 8: 0.65,
  9: 0.50, 10: 0.30, 11: 0.15, 12: 0.08,
}

function temperatureRisk(tempC) {
  if (tempC === null || tempC === undefined) return 0.3
  if (tempC < 18) return 0.05
  if (tempC < THRESHOLDS.TEMP_OPTIMAL_MIN) return 0.15 + (tempC - 18) * 0.02
  if (tempC <= 28) return 0.7 + (tempC - 22) * 0.02
  if (tempC <= THRESHOLDS.TEMP_OPTIMAL_MAX) return 0.85
  return 0.85 - (tempC - 30) * 0.05
}

function salinityRisk(salPpt) {
  if (salPpt === null || salPpt === undefined) return 0.3
  if (salPpt < 20) return 0.05
  if (salPpt < THRESHOLDS.SALINITY_MIN) return 0.1 + (salPpt - 20) * 0.04
  if (salPpt >= 28 && salPpt <= 34) return 0.85
  if (salPpt > 34) return 0.85 - (salPpt - 34) * 0.05
  return 0.6
}

function windRisk(speedMph, directionDeg) {
  if (speedMph === null || speedMph === undefined) return 0.3
  let risk = 0
  if (speedMph < THRESHOLDS.WIND_CALM_THRESHOLD) {
    risk = 0.75 + (THRESHOLDS.WIND_CALM_THRESHOLD - speedMph) * 0.05
  } else if (speedMph < 10) {
    risk = 0.45
  } else if (speedMph < 15) {
    risk = 0.25
  } else {
    risk = 0.10
  }
  if (directionDeg !== null && directionDeg !== undefined) {
    const isOnshore = directionDeg >= 135 && directionDeg <= 225
    if (isOnshore && speedMph > 3) risk = Math.min(1, risk * 1.3)
  }
  return Math.min(1, risk)
}

function doRisk(doMgL) {
  if (doMgL === null || doMgL === undefined) return 0.3
  if (doMgL >= 8) return 0.05
  if (doMgL >= 6) return 0.15
  if (doMgL >= THRESHOLDS.DO_RISK_LOW) return 0.35
  if (doMgL >= THRESHOLDS.DO_RISK_CRITICAL) return 0.70
  return 0.90
}

function nutrientLoadingRisk(streamflowCfs, turbiditNtu, nitrateN) {
  let risk = 0
  let count = 0
  if (streamflowCfs !== null && streamflowCfs !== undefined) {
    const month = new Date().getMonth() + 1
    if (streamflowCfs > 50000 && month >= 4 && month <= 8) risk += 0.6
    else if (streamflowCfs > 20000) risk += 0.3
    else risk += 0.1
    count++
  }
  if (turbiditNtu !== null && turbiditNtu !== undefined) {
    if (turbiditNtu > THRESHOLDS.TURBIDITY_HIGH) risk += 0.5
    else if (turbiditNtu > 5) risk += 0.2
    else risk += 0.05
    count++
  }
  if (nitrateN !== null && nitrateN !== undefined) {
    if (nitrateN > THRESHOLDS.NUTRIENT_HIGH_N) risk += 0.7
    else if (nitrateN > 0.5) risk += 0.3
    else risk += 0.05
    count++
  }
  return count > 0 ? Math.min(1, risk / count) : 0.25
}

function stratificationIndex(surfaceTempC, bottomTempC, surfaceSal, bottomSal) {
  let index = 0
  if (surfaceTempC !== null && bottomTempC !== null) {
    const tempDiff = surfaceTempC - bottomTempC
    if (tempDiff > 3) index += 0.7
    else if (tempDiff > 1) index += 0.4
  }
  if (surfaceSal !== null && bottomSal !== null) {
    const salDiff = bottomSal - surfaceSal
    if (salDiff > 5) index += 0.6
    else if (salDiff > 2) index += 0.3
  }
  return Math.min(1, index)
}

// ── GOES-19 risk functions ────────────────────────────────────────────────────

function goesStratificationRisk(sstGradientC) {
  // GOES-19 SST gradient: bay_max_c − bay_min_c. Threshold ≥3.5°C from API spec.
  if (sstGradientC == null) return 0.3
  if (sstGradientC >= 5.0) return 0.95  // severe — immediate hypoxia precursor
  if (sstGradientC >= 3.5) return 0.82  // API spec alarm threshold
  if (sstGradientC >= 2.0) return 0.55
  if (sstGradientC >= 1.0) return 0.30
  return 0.10
}

function rainfallNutrientPulseRisk(qpe6hMm, qpe24hMm) {
  // Heavy rain over watershed → N+P pulse → bay bloom 48-96h later
  const r6  = qpe6hMm  ?? 0
  const r24 = qpe24hMm ?? r6 * 4
  if (r24 >= 50) return 0.90
  if (r24 >= 25) return 0.75
  if (r6  >= 5)  return 0.55  // API spec nutrient-pulse trigger
  if (r24 >= 10) return 0.55
  if (r6  >= 2)  return 0.30
  return 0.10
}

function satelliteBloomSignal(bloomIndex) {
  // GOES-19 RGB: (NIR−Red)/(NIR+Red). Elevated = chlorophyll surface expression.
  if (bloomIndex == null) return 0.30
  if (bloomIndex >= 0.35) return 0.92
  if (bloomIndex >= 0.20) return 0.72
  if (bloomIndex >= 0.12) return 0.50
  if (bloomIndex >= 0.05) return 0.25
  return 0.10
}

function glmLightningMixingRisk(glmFlashes5min) {
  if (glmFlashes5min == null) return 0.15
  if (glmFlashes5min >= 20) return 0.80
  if (glmFlashes5min >= 5)  return 0.60
  if (glmFlashes5min >= 1)  return 0.40
  return 0.15
}

function parBloomGrowthRisk(parMmolM2, uvIndex) {
  const par = parMmolM2 ?? null
  const uv  = uvIndex ?? null
  if (par == null && uv == null) return 0.3
  let risk = 0.2
  if (par != null) {
    if (par > 40) risk = 0.85
    else if (par > 25) risk = 0.65
    else if (par > 10) risk = 0.40
    else risk = 0.15
  }
  if (uv != null && uv > 8) risk = Math.min(1, risk + 0.10)
  return risk
}

export function runHabOracle(inputs) {
  const {
    water_temp_c, salinity_ppt, wind_speed_mph, wind_direction_deg,
    do_mg_l, streamflow_cfs, turbidity_ntu, nitrate_mg_l,
    surface_temp_c, bottom_temp_c, bottom_salinity_ppt, chlorophyll_ug_l,
    goes_sst_gradient, goes_qpe_6h, goes_qpe_24h, goes_bloom_index, goes_glm_flashes,
    hf_speed_ms, hf_bloom_14h_km,
    par_mmol_m2, uv_index,
  } = inputs

  const month = new Date().getMonth() + 1
  const seasonalPrior = SEASONAL_BLOOM_RISK[month] || 0.25

  const factors = {
    temperature:             temperatureRisk(water_temp_c || surface_temp_c),
    salinity:                salinityRisk(salinity_ppt),
    wind:                    windRisk(wind_speed_mph, wind_direction_deg),
    dissolved_oxygen:        doRisk(do_mg_l),
    nutrient_loading:        nutrientLoadingRisk(streamflow_cfs, turbidity_ntu, nitrate_mg_l),
    stratification:          stratificationIndex(surface_temp_c || water_temp_c, bottom_temp_c, salinity_ppt, bottom_salinity_ppt),
    goes_stratification:     goesStratificationRisk(goes_sst_gradient),
    rainfall_nutrient_pulse: rainfallNutrientPulseRisk(goes_qpe_6h, goes_qpe_24h),
    satellite_bloom:         satelliteBloomSignal(goes_bloom_index),
    glm_lightning_mixing:    glmLightningMixingRisk(goes_glm_flashes),
    par_bloom_growth:        parBloomGrowthRisk(par_mmol_m2, uv_index),
  }

  const WEIGHTS = {
    temperature:             0.11,
    salinity:                0.08,
    wind:                    0.11,
    dissolved_oxygen:        0.09,
    nutrient_loading:        0.08,
    stratification:          0.08,
    goes_stratification:     0.12,
    rainfall_nutrient_pulse: 0.09,
    satellite_bloom:         0.09,
    glm_lightning_mixing:    0.07,
    par_bloom_growth:        0.08,
  }

  let weightedRisk = 0
  for (const [factor, weight] of Object.entries(WEIGHTS)) {
    weightedRisk += factors[factor] * weight
  }

  // ── Seasonal prior: decoupled from current-conditions risk ─────────────────
  // Previously the prior got 25% of the posterior weight, which pushed even
  // benign conditions into "moderate" during July–September and fueled alert
  // fatigue. We now keep current-conditions risk as the primary signal and
  // only apply a small Bayesian lift (max +7pp) when the prior disagrees with
  // current conditions by a wide margin. Both values are still returned so
  // operators can see the seasonal context separately.
  const currentConditionsRisk = weightedRisk
  const priorDelta = seasonalPrior - currentConditionsRisk
  const SEASONAL_LIFT_MAX = 0.07
  const seasonalAdjustment = Math.max(-SEASONAL_LIFT_MAX, Math.min(SEASONAL_LIFT_MAX, priorDelta * 0.25))
  const posteriorRisk = Math.max(0, Math.min(1, currentConditionsRisk + seasonalAdjustment))

  let chlorophyllBoost = 0
  if (chlorophyll_ug_l !== null && chlorophyll_ug_l !== undefined) {
    const seasonalBaseline = { 1:3,2:3,3:5,4:8,5:12,6:18,7:22,8:25,9:18,10:10,11:5,12:3 }
    const baseline = seasonalBaseline[month] || 10
    if (chlorophyll_ug_l > baseline * 2) chlorophyllBoost = 0.15
    else if (chlorophyll_ug_l > baseline * 1.5) chlorophyllBoost = 0.08
  }

  const finalProbability = Math.min(100, Math.round((posteriorRisk + chlorophyllBoost) * 100))

  let riskLevel, color, action
  if (finalProbability < 20) {
    riskLevel = 'LOW'; color = 'green'
    action = 'Normal monitoring. No immediate action required.'
  } else if (finalProbability < 45) {
    riskLevel = 'MODERATE'; color = 'yellow'
    action = 'Increased monitoring frequency. Alert shellfish managers.'
  } else if (finalProbability < 65) {
    riskLevel = 'ELEVATED'; color = 'orange'
    action = 'Issue advisory. Notify ADPH and shellfish operators. Consider aerial confirmation request.'
  } else if (finalProbability < 80) {
    riskLevel = 'HIGH'; color = 'red'
    action = 'Issue public warning. Recommend precautionary shellfish harvest delay. Request Vexcel On Demand collect.'
  } else {
    riskLevel = 'CRITICAL'; color = 'darkred'
    action = 'IMMEDIATE: Issue closure order. Activate autonomous alert dispatch. Request emergency aerial confirmation.'
  }

  const rankedFactors = Object.entries(factors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, score]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: Math.round(score * 100),
      contribution: name,
    }))

  const trendScore = finalProbability
  const outlook = {
    h24: Math.min(100, Math.round(trendScore * 1.05)),
    h48: Math.min(100, Math.round(trendScore * (seasonalPrior > 0.4 ? 1.10 : 0.95))),
    h72: Math.min(100, Math.round(trendScore * (seasonalPrior > 0.4 ? 1.08 : 0.90))),
  }

  return {
    probability: finalProbability,
    riskLevel,
    color,
    action,
    factors,
    rankedFactors,
    currentConditionsRisk: Math.round(currentConditionsRisk * 100),
    seasonalPrior: Math.round(seasonalPrior * 100),
    seasonalAdjustment: Math.round(seasonalAdjustment * 100),
    outlook,
    timestamp: new Date().toISOString(),
    dataQuality: {
      inputCount: Object.values(inputs).filter(v => v !== null && v !== undefined).length,
      totalInputs: Object.keys(inputs).length,
      confidence: Object.values(inputs).filter(v => v !== null && v !== undefined).length >= 8 ? 'HIGH' : 'MODERATE',
      goesConnected: goes_sst_gradient != null || goes_bloom_index != null,
      hfRadarConnected: hf_speed_ms != null,
    },
    version: '2.2.0',
    methodology: '11-factor weighted ensemble + Bayesian seasonal prior. Based on Gulf Coast K. brevis ecology (Stumpf et al., NOAA). Includes PAR bloom growth factor.',
  }
}

export function runHypoxiaForecast(inputs) {
  const {
    water_temp_c, salinity_ppt, wind_speed_mph, streamflow_cfs, do_mg_l,
    halocline_strength, bottom_salinity_ppt, goes_sst_gradient,
  } = inputs
  const month = new Date().getMonth() + 1

  const SEASONAL_HYPOXIA = { 1:0.05,2:0.05,3:0.08,4:0.15,5:0.30,6:0.50,7:0.75,8:0.80,9:0.55,10:0.25,11:0.10,12:0.05 }
  const seasonalBase = SEASONAL_HYPOXIA[month] || 0.20

  let hypoxiaRisk = seasonalBase

  if (water_temp_c > 28) hypoxiaRisk += 0.20
  else if (water_temp_c > 25) hypoxiaRisk += 0.10

  if (wind_speed_mph < 5) hypoxiaRisk += 0.25
  else if (wind_speed_mph < 10) hypoxiaRisk += 0.10
  else hypoxiaRisk -= 0.15

  if (streamflow_cfs > 50000) hypoxiaRisk += 0.20
  else if (streamflow_cfs > 20000) hypoxiaRisk += 0.08

  if (do_mg_l < 4) hypoxiaRisk += 0.30
  else if (do_mg_l < 6) hypoxiaRisk += 0.15

  const halo = halocline_strength ?? (bottom_salinity_ppt != null && salinity_ppt != null ? bottom_salinity_ppt - salinity_ppt : null)
  if (halo != null) {
    if (halo > 5) hypoxiaRisk += 0.20
    else if (halo > 3) hypoxiaRisk += 0.12
    else if (halo > 1) hypoxiaRisk += 0.05
  }

  if (goes_sst_gradient != null && goes_sst_gradient >= 3.5) {
    hypoxiaRisk += 0.15
  }

  const finalRisk = Math.min(100, Math.round(hypoxiaRisk * 100))

  const isJubileeCondition = finalRisk > 65 && month >= 5 && month <= 9
    && wind_speed_mph != null && wind_speed_mph < 5
    && (halo == null || halo > 2)
    && do_mg_l != null && do_mg_l < 4

  return {
    probability: finalRisk,
    riskLevel: finalRisk < 25 ? 'LOW' : finalRisk < 50 ? 'MODERATE' : finalRisk < 70 ? 'ELEVATED' : 'HIGH',
    expectedMinDO: finalRisk > 60 ? 2.5 : finalRisk > 40 ? 4.0 : 6.0,
    jubileeRisk: isJubileeCondition,
    jubileeDetails: isJubileeCondition ? {
      description: 'Mobile Bay Jubilee conditions detected — hypoxic bottom water pushing marine life to eastern shore',
      triggers: ['Low DO₂', 'Calm wind', 'Strong halocline', 'Summer season'],
      historicalNote: 'Jubilees occur primarily along the eastern shore of Mobile Bay, concentrated near Daphne and Fairhope.',
    } : null,
    haloclineModel: halo != null ? {
      strength: Math.round(halo * 10) / 10,
      interpretation: halo > 5 ? 'Strong stratification — limited vertical mixing' : halo > 3 ? 'Moderate stratification' : 'Weak — good mixing',
    } : null,
    forecast_days: 5,
    timestamp: new Date().toISOString(),
  }
}

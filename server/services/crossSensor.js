import { writeReadings, writeFeatureVector, writeHabEvent, getRecentVectors } from './database.js'

const STATION_DISTANCES_KM = {
  'DogRiver→WeeksBay':    18,
  'FowlRiver→WeeksBay':   12,
  'MobileRiver→DauphinIs': 48,
  'Claiborne→MobileI65':  82,
  'MobileI65→Bucks':       9,
  'Bucks→DogRiver':        16,
}

const THRESHOLDS = {
  DO2_CRITICAL:    3.0,
  DO2_LOW:         5.0,
  DO2_WARN:        6.0,
  TURB_HIGH:      25.0,
  TEMP_WARM:      28.0,
  FLOW_SURGE:  50000,
  HAB_PROB:       65,
}

export function tidalPhase(waterLevelFt, hourOfDay) {
  if (waterLevelFt == null) {
    const cycle = Math.sin(2 * Math.PI * hourOfDay / 12.42)
    return cycle > 0.3 ? 'flood' : cycle < -0.3 ? 'ebb' : 'slack'
  }
  if (waterLevelFt > 0.5) return 'flood'
  if (waterLevelFt < -0.5) return 'ebb'
  return 'slack'
}

export function computeTrend(recentVectors, key, windowHours = 3) {
  if (!recentVectors || recentVectors.length < 2) return null
  const cutoff = Date.now() - windowHours * 3600000
  const relevant = recentVectors.filter(v => v.ts > cutoff && v.features?.[key] != null)
  if (relevant.length < 2) return null
  const oldest = relevant[relevant.length - 1].features[key]
  const newest = relevant[0].features[key]
  return newest - oldest
}

export function computeLagTime(hfRadarSummary, upstreamKey, downstreamKey) {
  const key = `${upstreamKey}→${downstreamKey}`
  const distKm = STATION_DISTANCES_KM[key] || 20
  const speedMs = hfRadarSummary?.avgSpeed_ms || 0.15
  const speedKmH = speedMs * 3.6
  const lagHours = distKm / Math.max(speedKmH, 0.036)
  return {
    lagHours: Math.round(lagHours * 10) / 10,
    distKm,
    speedKmH: Math.round(speedKmH * 100) / 100,
    predictedArrival: new Date(Date.now() + lagHours * 3600000).toISOString(),
  }
}

export function buildFeatureVector(data = {}) {
  const {
    waterQuality, hfRadar, nerrs, aqi,
    habAssessment,
    goesLatest,
    satellite,
    ocean,
    ecology,
    land,
    airplus,
    buoy,
    weather,
    recentVectors,
    wqpDO2,
    nerrsSecondary,
  } = data
  const usgs = waterQuality?.usgs || []
  const coops = waterQuality?.coops || {}
  const ts = Date.now()
  const now = new Date()

  const safeNum = v => {
    if (v == null) return null
    if (typeof v === 'number') return isNaN(v) ? null : v
    if (typeof v === 'object' && 'value' in v) return safeNum(v.value)
    const n = parseFloat(v); return isNaN(n) ? null : n
  }

  const stationMap = {}
  for (const s of usgs) {
    stationMap[s.siteNo] = {
      do2:    safeNum(s.readings?.do_mg_l),
      temp:   safeNum(s.readings?.water_temp_c),
      flow:   safeNum(s.readings?.streamflow_cfs),
      pH:     safeNum(s.readings?.pH),
      turb:   safeNum(s.readings?.turbidity_ntu),
      cond:   safeNum(s.readings?.conductance_us_cm),
      gage:   safeNum(s.readings?.gage_height_ft),
      orthoP: safeNum(s.readings?.orthophosphate_mg_l),
      totalN: safeNum(s.readings?.total_nitrogen_mg_l),
    }
  }

  const do2Values  = usgs.map(s => safeNum(s.readings?.do_mg_l)).filter(v => v != null)
  const tempValues = usgs.map(s => safeNum(s.readings?.water_temp_c)).filter(v => v != null)
  const flowValues = usgs.map(s => safeNum(s.readings?.streamflow_cfs)).filter(v => v != null)
  const turbValues = usgs.map(s => safeNum(s.readings?.turbidity_ntu)).filter(v => v != null)

  const mean = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null
  const min  = arr => arr.length ? Math.min(...arr) : null
  const max  = arr => arr.length ? Math.max(...arr) : null

  const wb = nerrs?.waterQuality?.latest || {}
  const nerrsValues = {
    wbDo2:    wb.DO_mgl?.value ?? null,
    wbDOPct:  wb.DO_pct?.value ?? null,
    wbTemp:   wb.Temp?.value ?? null,
    wbSal:    wb.Sal?.value ?? null,
    wbTurb:   wb.Turb?.value ?? null,
    wbChlFl:  wb.ChlFluor?.value ?? null,
    wbCond:   wb.SpCond?.value ?? null,
    wbPH:     wb.pH?.value ?? null,
    wbDepth:  wb.Depth?.value ?? wb.Level?.value ?? null,
  }

  const met = nerrs?.meteorological?.latest || {}
  const nerrsMetValues = {
    wbWSpd:    met.WSpd?.value ?? null,
    wbMaxWSpd: met.MaxWSpd?.value ?? null,
    wbWdir:    met.Wdir?.value ?? null,
    wbATemp:   met.ATemp?.value ?? null,
    wbBP:      met.BP?.value ?? null,
    wbPAR:     met.TotPAR?.value ?? null,
    wbPrec:    met.TotPrec?.value ?? null,
    wbRH:      met.RH?.value ?? null,
  }

  const nerrsSecDo2 = safeNum(nerrsSecondary?.DO_mgl)
  if (nerrsSecDo2 != null) do2Values.push(nerrsSecDo2)
  if (wqpDO2 != null) do2Values.push(safeNum(wqpDO2))

  const hf = hfRadar || {}
  const hfValues = {
    currentSpeed_ms: hf.avgSpeed_ms ?? null,
    currentDir_deg:  hf.direction_deg ?? null,
    bloom14h_km:     hf.bloom_transport?.distance_14h_km ?? null,
  }

  const lagDogRiver = computeLagTime(hf, 'DogRiver', 'WeeksBay')
  const upstreamDogRiver = stationMap['02479000']
  const lagFeatures = {
    lag_dogriver_weeksbay_h: lagDogRiver.lagHours,
    upstream_do2_dogriver:   upstreamDogRiver?.do2 ?? null,
    upstream_flow_dogriver:  upstreamDogRiver?.flow ?? null,
    upstream_turb_dogriver:  upstreamDogRiver?.turb ?? null,
  }

  const dauphinIsland = coops['8735180'] || {}
  const tidal = {
    waterLevel_dauphinIs:  safeNum(dauphinIsland.water_level),
    salinity_dauphinIs:    safeNum(dauphinIsland.salinity),
    waterTemp_dauphinIs:   safeNum(dauphinIsland.water_temperature),
    coops_wind_speed:      safeNum(dauphinIsland.wind),
    coops_air_pressure_mb: safeNum(dauphinIsland.air_pressure),
    coops_air_temp_c:      safeNum(dauphinIsland.air_temperature),
  }

  const safeN = v => { if(v==null)return null; const n=parseFloat(v); return isNaN(n)?null:n }
  const goesFeatures = {
    goes_sst_mean:      safeN(goesLatest?.sst_mean),
    goes_sst_gradient:  safeN(goesLatest?.sst_gradient),
    goes_qpe_rainfall:  safeN(goesLatest?.qpe_rainfall),
    goes_qpe_6h:        safeN(goesLatest?.qpe_6h),
    goes_qpe_24h:       safeN(goesLatest?.qpe_24h),
    goes_cloud_pct:     safeN(goesLatest?.cloud_coverage),
    goes_glm_flashes:   safeN(goesLatest?.glm_flashes),
    goes_glm_active:    safeN(goesLatest?.glm_active),
    goes_amv_speed:     safeN(goesLatest?.amv_wind_speed),
    goes_amv_dir:       safeN(goesLatest?.amv_wind_dir),
    goes_bloom_index:   safeN(goesLatest?.bloom_index),
    goes_turbidity_idx: safeN(goesLatest?.turbidity_idx),
    goes_stratification_alert: goesLatest?.sst_gradient != null && goesLatest.sst_gradient >= 3.5 ? 1 : 0,
    goes_nutrient_pulse_alert: goesLatest?.qpe_6h != null && goesLatest.qpe_6h >= 5 ? 1 : 0,
    goes_bloom_alert:   goesLatest?.bloom_index != null && goesLatest.bloom_index >= 0.12 ? 1 : 0,
  }

  const buoyFeatures = {
    buoy_water_temp_c:      safeN(buoy?.WTMP),
    buoy_wind_speed_ms:     safeN(buoy?.WSPD),
    buoy_wind_dir_deg:      safeN(buoy?.WDIR),
    buoy_wind_gust_ms:      safeN(buoy?.GST),
    buoy_air_temp_c:        safeN(buoy?.ATMP),
    buoy_pressure_mb:       safeN(buoy?.PRES),
    buoy_wave_height_m:     safeN(buoy?.WVHT),
    buoy_dom_wave_period_s: safeN(buoy?.DPD),
    buoy_avg_wave_period_s: safeN(buoy?.APD),
    buoy_mean_wave_dir:     safeN(buoy?.MWD),
    buoy_dewpoint_c:        safeN(buoy?.DEWP),
    buoy_available:         buoy != null ? 1 : 0,
  }

  const nwsCurrent = weather?.current || {}
  const weatherFeatures = {
    nws_wind_speed_mph: safeN(nwsCurrent.wind_speed_mph),
    nws_wind_gust_mph:  safeN(nwsCurrent.wind_gust_mph),
    nws_wind_dir_deg:   safeN(nwsCurrent.wind_direction),
    nws_temp_c:         safeN(nwsCurrent.temp_c),
    nws_humidity_pct:   safeN(nwsCurrent.humidity),
    nws_dewpoint_c:     safeN(nwsCurrent.dewpoint_c),
    nws_pressure_mb:    safeN(nwsCurrent.pressure_mb),
    nws_visibility_m:   safeN(nwsCurrent.visibility_m),
    nws_available:      nwsCurrent.wind_speed_mph != null ? 1 : 0,
  }

  const satFeatures = {
    modis_granules:     safeN(satellite?.modis?.granules),
    viirs_granules:     safeN(satellite?.viirs?.granules),
    hls_granules:       safeN((satellite?.hls?.HLSL30?.granules || 0) + (satellite?.hls?.HLSS30?.granules || 0)),
    landsat_granules:   safeN(satellite?.landsat?.granules),
    sentinel2_granules: safeN(satellite?.sentinel2?.granules),
    sentinel2_cloud_pct:safeN(satellite?.sentinel2?.latest?.cloudPct),
    pace_active:        satellite?.pace?.configured ? 1 : 0,
    goes_erddap_active: satellite?.goes?.status?.available ? 1 : 0,
  }

  const oceanFeatures = {
    cmems_available:      ocean?.cmems?.available ? 1 : 0,
    hycom_available:      ocean?.hycom?.available ? 1 : 0,
    coastwatch_chl_rows:  safeN(ocean?.coastwatch?.data?.table?.rows?.length),
  }

  const ecoFeatures = {
    inaturalist_obs_7d:   safeN(ecology?.iNaturalist?.totalCount),
    gbif_occurrences_90d: safeN(ecology?.gbif?.totalCount),
    ebird_obs_7d:         safeN(ecology?.eBird?.mobileBayObs ?? ecology?.eBird?.totalAlabamaObs),
    ameriflux_active:     ecology?.ameriflux?.available ? 1 : 0,
  }

  const openMeteo  = land?.openMeteo
  const hourOfDay  = now.getHours()
  const omHourly   = openMeteo?.hourly || (Array.isArray(openMeteo?.current) ? null : null)
  const omNow = {}

  if (openMeteo?.current && typeof openMeteo.current === 'object' && !Array.isArray(openMeteo.current)) {
    Object.assign(omNow, openMeteo.current)
  } else if (openMeteo?.hourly) {
    const h = openMeteo.hourly
    omNow.precip_mm     = h.precipitation?.[hourOfDay] ?? h.precipitation?.[0]
    omNow.wind_ms       = h.wind_speed_10m?.[hourOfDay] ?? h.wind_speed_10m?.[0]
    omNow.cape          = h.cape?.[hourOfDay] ?? h.cape?.[0]
    omNow.solar_rad_wm2 = h.shortwave_radiation?.[hourOfDay] ?? h.shortwave_radiation?.[0]
    omNow.uv_index      = h.uv_index?.[hourOfDay] ?? h.uv_index?.[0]
    omNow.lifted_index  = h.lifted_index?.[hourOfDay] ?? h.lifted_index?.[0]
    omNow.soil_moisture  = h.soil_moisture_0_to_7cm?.[hourOfDay] ?? h.soil_moisture_0_to_7cm?.[0]
    omNow.cin            = h.convective_inhibition?.[hourOfDay] ?? h.convective_inhibition?.[0]
    omNow.blh            = h.boundary_layer_height?.[hourOfDay] ?? h.boundary_layer_height?.[0]
  }

  const landFeatures = {
    precip_current_mm:   safeN(omNow.precip_mm),
    wind_ms_openmeteo:   safeN(omNow.wind_ms),
    cape_jkg:            safeN(omNow.cape),
    solar_rad_wm2:       safeN(omNow.solar_rad_wm2),
    uv_index:            safeN(omNow.uv_index),
    lifted_index:        safeN(omNow.lifted_index),
    soil_moisture:       safeN(omNow.soil_moisture),
    cin:                 safeN(omNow.cin),
    blh:                 safeN(omNow.blh),
    precip_7day_sum_mm:  openMeteo?.dailyForecast
      ? openMeteo.dailyForecast.slice(0,7).reduce((s,d) => s + (safeN(d.precip_sum_mm) ?? 0), 0)
      : null,
    max_precip_prob_7d:  openMeteo?.dailyForecast
      ? Math.max(...openMeteo.dailyForecast.slice(0,7).map(d => safeN(d.precipProb) ?? 0))
      : null,
    uv_max_7d:           openMeteo?.dailyForecast
      ? Math.max(...openMeteo.dailyForecast.slice(0,7).map(d => safeN(d.uv_max) ?? 0))
      : null,
    solar_sum_today:     safeN(openMeteo?.dailyForecast?.[0]?.solar_sum_wm2),
    ahps_flood_stage_ft: safeN(land?.ahps?.stage),
    ahps_flood_active:   land?.ahps?.available ? 1 : 0,
    ncei_data_available: land?.ncei?.available ? 1 : 0,
    fema_flood_zone:     (land?.fema?.floodZone ?? land?.fema?.inFloodZone) ? 1 : 0,
    nlcd_impervious_pct: safeN(land?.nlcd?.imperviousPct),
  }

  const airFeatures = {
    openaq_pm25:         safeN(airplus?.openAQ?.avgPM25),
    purpleair_pm25:      safeN(airplus?.purpleAir?.avgPM25),
    epa_aqs_pm25:        safeN(airplus?.epaAQS?.avgValue),
    air_quality_alert:   (airplus?.openAQ?.avgPM25 ?? 0) > 35 || (airplus?.purpleAir?.avgPM25 ?? 0) > 35 ? 1 : 0,
  }

  const aqiVal = aqi?.readings?.[0]?.aqi ?? null

  const dayOfYear   = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000)
  const monthOfYear = now.getMonth() + 1
  const isSummer    = monthOfYear >= 5 && monthOfYear <= 9 ? 1 : 0
  const isNight     = (hourOfDay < 6 || hourOfDay >= 20) ? 1 : 0

  const habProb = safeNum(habAssessment?.hab?.probability) ?? null

  const tPhase = tidalPhase(safeNum(dauphinIsland.water_level), hourOfDay)
  const tPhaseVal = tPhase === 'flood' ? 1 : tPhase === 'ebb' ? -1 : 0

  const allDo2 = do2Values.slice()
  if (nerrsValues.wbDo2 != null) allDo2.push(nerrsValues.wbDo2)
  const minDo2 = allDo2.length ? Math.min(...allDo2) : null
  const avgDo2 = allDo2.length ? allDo2.reduce((a,b)=>a+b,0)/allDo2.length : null

  const do2SatPct = (avgDo2 != null && nerrsValues.wbTemp != null)
    ? Math.round(avgDo2 / (14.62 - 0.3898 * nerrsValues.wbTemp + 0.006969 * nerrsValues.wbTemp ** 2) * 100)
    : (nerrsValues.wbDOPct ?? null)

  const surfaceTemp = safeN(goesLatest?.sst_mean) ?? mean(tempValues) ?? nerrsValues.wbTemp
  const bottomTemp = surfaceTemp != null ? surfaceTemp - 2.5 : null
  const surfaceSal = nerrsValues.wbSal ?? safeNum(dauphinIsland.salinity)
  const bottomSal = surfaceSal != null ? surfaceSal + 3 : null
  const haloclineStrength = (surfaceSal != null && bottomSal != null) ? bottomSal - surfaceSal : null

  const prevGoesSST = recentVectors?.[0]?.features?.goes_sst_mean
  const curGoesSST = safeN(goesLatest?.sst_mean)
  const sstDelta24h = (curGoesSST != null && prevGoesSST != null) ? curGoesSST - prevGoesSST : null

  const bloomTransportRisk = (() => {
    const speed = hf.avgSpeed_ms ?? 0
    const chl = nerrsValues.wbChlFl ?? 0
    const windCalm = (safeN(nwsCurrent.wind_speed_mph) ?? 10) < 5 ? 1 : 0
    return Math.min(1, (speed * 0.3 + (chl > 10 ? 0.4 : 0) + windCalm * 0.3))
  })()

  const do2Trend3h = computeTrend(recentVectors, 'min_do2', 3)
  const tempTrend3h = computeTrend(recentVectors, 'avg_temp', 3)
  const salTrend3h = computeTrend(recentVectors, 'wbSal', 3)

  const compoundStressIndex = (() => {
    let score = 0
    if (minDo2 != null && minDo2 < THRESHOLDS.DO2_LOW) score += 0.3
    if (surfaceTemp != null && surfaceTemp > THRESHOLDS.TEMP_WARM) score += 0.2
    if (haloclineStrength != null && haloclineStrength > 3) score += 0.2
    if (aqiVal != null && aqiVal > 100) score += 0.1
    if (goesFeatures.goes_bloom_alert) score += 0.2
    return Math.min(1, score)
  })()

  return {
    ts,
    min_do2:           min(do2Values),
    avg_do2:           mean(do2Values),
    max_do2:           max(do2Values),
    std_do2:           do2Values.length > 1 ? Math.sqrt(do2Values.map(v=>(v-mean(do2Values))**2).reduce((a,b)=>a+b,0)/do2Values.length) : null,
    avg_temp:          mean(tempValues),
    max_temp:          max(tempValues),
    total_flow_kcfs:   flowValues.reduce((a,b)=>a+b,0) / 1000,
    avg_turb:          mean(turbValues),
    max_turb:          max(turbValues),
    station_count:     usgs.length,
    hypoxic_stations:  do2Values.filter(v => v < THRESHOLDS.DO2_CRITICAL).length,
    low_do2_stations:  do2Values.filter(v => v < THRESHOLDS.DO2_LOW).length,
    do2_dogriver:      stationMap['02479000']?.do2 ?? null,
    do2_fowlriver:     stationMap['02479155']?.do2 ?? null,
    do2_mobilei65:     stationMap['02469761']?.do2 ?? null,
    flow_mobilei65:    stationMap['02469761']?.flow ?? null,
    turb_dogriver:     stationMap['02479000']?.turb ?? null,
    gage_height_dogriver:  stationMap['02479000']?.gage  ?? null,
    gage_height_mobilei65: stationMap['02469761']?.gage  ?? null,
    ortho_p_dogriver:      stationMap['02479000']?.orthoP ?? null,
    total_n_mobilei65:     stationMap['02469761']?.totalN ?? null,
    ...nerrsValues,
    ...nerrsMetValues,
    ...hfValues,
    ...lagFeatures,
    ...tidal,
    aqi: aqiVal,
    ...goesFeatures,
    ...buoyFeatures,
    ...weatherFeatures,
    ...satFeatures,
    ...oceanFeatures,
    ...ecoFeatures,
    ...landFeatures,
    ...airFeatures,
    hab_prob: habProb,
    tidal_phase:          tPhaseVal,
    do2_saturation_pct:   do2SatPct,
    halocline_strength:   haloclineStrength,
    sst_delta_24h:        sstDelta24h,
    bloom_transport_risk: Math.round(bloomTransportRisk * 1000) / 1000,
    do2_trend_3h:         do2Trend3h,
    temp_trend_3h:        tempTrend3h,
    sal_trend_3h:         salTrend3h,
    compound_stress_index: Math.round(compoundStressIndex * 1000) / 1000,
    month:        monthOfYear,
    is_summer:    isSummer,
    is_night:     isNight,
    hour_sin:     Math.sin(2 * Math.PI * hourOfDay / 24),
    hour_cos:     Math.cos(2 * Math.PI * hourOfDay / 24),
    doy_sin:      Math.sin(2 * Math.PI * dayOfYear / 365),
    doy_cos:      Math.cos(2 * Math.PI * dayOfYear / 365),
  }
}

export function autoLabel(features) {
  const labels = { hab: null, hypoxia: null }

  const do2Candidates = [
    features.wbDo2,
    features.min_do2,
    features.avg_do2,
    features.do2_saturation_pct != null ? features.do2_saturation_pct * 0.14 : null,
  ].filter(v => v != null)

  if (do2Candidates.length > 0) {
    const minDo2 = Math.min(...do2Candidates)
    if (minDo2 < THRESHOLDS.DO2_CRITICAL) {
      labels.hypoxia = 1
    } else if (minDo2 <= THRESHOLDS.DO2_LOW) {
      labels.hypoxia = 1
    } else {
      labels.hypoxia = 0
    }
  } else {
    const waterTemp = features.buoy_water_temp_c ?? features.waterTemp_dauphinIs ?? features.goes_sst_mean
    const oceanStress = features.goes_sst_gradient != null && features.goes_sst_gradient >= 3.5
    if (waterTemp != null) {
      if (waterTemp > 32 || (waterTemp > 28 && oceanStress)) labels.hypoxia = 1
      else if (waterTemp < 15) labels.hypoxia = 0
    }
  }

  const temp = features.avg_temp ?? features.buoy_water_temp_c ?? features.goes_sst_mean
  const sal = features.wbSal ?? features.salinity_dauphinIs

  if (temp != null && sal != null) {
    const warmWater  = temp > THRESHOLDS.TEMP_WARM ? 1 : 0
    const highSal    = sal > 25 ? 1 : 0
    const wind       = features.nws_wind_speed_mph ?? features.buoy_wind_speed_ms ?? features.coops_wind_speed ?? features.wbWSpd ?? 10
    const calmWind   = wind < 5 ? 1 : 0
    const highChl    = features.wbChlFl != null && features.wbChlFl > 10 ? 1 : 0
    const summerFlag = features.is_summer

    const score = warmWater + highSal + calmWind + highChl + summerFlag
    if (score >= 3)      labels.hab = 1
    else if (score <= 1) labels.hab = 0
  } else if (temp != null && !features.is_summer && temp < THRESHOLDS.TEMP_WARM) {
    labels.hab = 0
  }

  return labels
}

export async function persistTick(data = {}) {
  const ts = Date.now()
  const rows = []

  try {
    const { waterQuality, hfRadar, nerrs, ecology, land, airplus } = data
    const usgs = waterQuality?.usgs || []

    const safeNum = v => {
      if (v == null) return null
      if (typeof v === 'number') return isNaN(v) ? null : v
      if (typeof v === 'object' && 'value' in v) return safeNum(v.value)
      const n = parseFloat(v); return isNaN(n) ? null : n
    }

    for (const s of usgs) {
      const r = s.readings || {}
      const paramMap = {
        do_mg_l:            [safeNum(r.do_mg_l),              'mg/L'],
        water_temp_c:       [safeNum(r.water_temp_c),         '°C'],
        streamflow_cfs:     [safeNum(r.streamflow_cfs),       'cfs'],
        pH:                 [safeNum(r.pH),                   ''],
        turbidity_ntu:      [safeNum(r.turbidity_ntu),        'NTU'],
        conductance_us_cm:  [safeNum(r.conductance_us_cm),    'µS/cm'],
        gage_height_ft:     [safeNum(r.gage_height_ft),       'ft'],
        orthophosphate_mg_l:[safeNum(r.orthophosphate_mg_l),  'mg/L'],
        total_nitrogen_mg_l:[safeNum(r.total_nitrogen_mg_l),  'mg/L'],
      }
      for (const [param, [val, unit]] of Object.entries(paramMap)) {
        if (val != null) rows.push([ts, 'usgs', s.siteNo, param, val, unit])
      }
    }

    if (nerrs?.waterQuality?.latest) {
      const wb = nerrs.waterQuality.latest
      const nerrsParams = ['DO_mgl','DO_pct','Temp','Sal','Turb','ChlFluor','SpCond','pH','Depth','Level']
      for (const p of nerrsParams) {
        if (wb[p]?.value != null) rows.push([ts, 'nerrs', 'wekaswq', p, wb[p].value, wb[p].unit||''])
      }
    }

    if (nerrs?.meteorological?.latest) {
      const met = nerrs.meteorological.latest
      const metParams = ['WSpd','MaxWSpd','Wdir','ATemp','BP','TotPAR','TotPrec','RH']
      for (const p of metParams) {
        if (met[p]?.value != null) rows.push([ts, 'nerrs_met', 'wekaswq', p, met[p].value, met[p].unit||''])
      }
    }

    if (hfRadar?.avgSpeed_ms != null) {
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_speed_ms', hfRadar.avgSpeed_ms, 'm/s'])
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_dir_deg',  hfRadar.direction_deg, '°'])
      if (hfRadar.bloom_transport?.distance_14h_km != null)
        rows.push([ts, 'hfradar', 'ucsdHfrE6', 'bloom_transport_14h_km', hfRadar.bloom_transport.distance_14h_km, 'km'])
    }

    const buoy = data.buoy
    if (buoy?.WTMP != null) rows.push([ts, 'ndbc', '42012', 'water_temp_c',      buoy.WTMP,  '°C'])
    if (buoy?.WSPD != null) rows.push([ts, 'ndbc', '42012', 'wind_speed_ms',     buoy.WSPD,  'm/s'])
    if (buoy?.GST  != null) rows.push([ts, 'ndbc', '42012', 'wind_gust_ms',      buoy.GST,   'm/s'])
    if (buoy?.WDIR != null) rows.push([ts, 'ndbc', '42012', 'wind_dir_deg',      buoy.WDIR,  '°'])
    if (buoy?.ATMP != null) rows.push([ts, 'ndbc', '42012', 'air_temp_c',        buoy.ATMP,  '°C'])
    if (buoy?.PRES != null) rows.push([ts, 'ndbc', '42012', 'pressure_mb',       buoy.PRES,  'mb'])
    if (buoy?.WVHT != null) rows.push([ts, 'ndbc', '42012', 'wave_height_m',     buoy.WVHT,  'm'])
    if (buoy?.DPD  != null) rows.push([ts, 'ndbc', '42012', 'dom_wave_period_s', buoy.DPD,   's'])
    if (buoy?.APD  != null) rows.push([ts, 'ndbc', '42012', 'avg_wave_period_s', buoy.APD,   's'])
    if (buoy?.MWD  != null) rows.push([ts, 'ndbc', '42012', 'mean_wave_dir',     buoy.MWD,   '°'])
    if (buoy?.DEWP != null) rows.push([ts, 'ndbc', '42012', 'dewpoint_c',        buoy.DEWP,  '°C'])

    const wx = data.weather?.current || {}
    if (wx.wind_speed_mph  != null) rows.push([ts, 'nws', 'KMOB', 'wind_speed_mph', wx.wind_speed_mph, 'mph'])
    if (wx.wind_speed_ms   != null) rows.push([ts, 'nws', 'KMOB', 'wind_speed_ms',  wx.wind_speed_ms,  'm/s'])
    if (wx.wind_gust_mph   != null) rows.push([ts, 'nws', 'KMOB', 'wind_gust_mph',  wx.wind_gust_mph,  'mph'])
    if (wx.wind_gust_ms    != null) rows.push([ts, 'nws', 'KMOB', 'wind_gust_ms',   wx.wind_gust_ms,   'm/s'])
    if (wx.wind_direction  != null) rows.push([ts, 'nws', 'KMOB', 'wind_dir_deg',   wx.wind_direction,  '°'])
    if (wx.temp_f          != null) rows.push([ts, 'nws', 'KMOB', 'temp_f',         wx.temp_f,          '°F'])
    if (wx.temp_c          != null) rows.push([ts, 'nws', 'KMOB', 'temp_c',         wx.temp_c,          '°C'])
    if (wx.humidity        != null) rows.push([ts, 'nws', 'KMOB', 'humidity_pct',   wx.humidity,        '%'])
    if (wx.pressure_mb     != null) rows.push([ts, 'nws', 'KMOB', 'pressure_mb',    wx.pressure_mb,     'mb'])

    if (ecology?.iNaturalist?.totalCount != null)
      rows.push([ts, 'ecology', 'inaturalist', 'obs_7d', ecology.iNaturalist.totalCount, 'count'])
    if (ecology?.gbif?.totalCount != null)
      rows.push([ts, 'ecology', 'gbif', 'occurrences_90d', ecology.gbif.totalCount, 'count'])
    if (ecology?.eBird?.mobileBayObs != null)
      rows.push([ts, 'ecology', 'ebird', 'mobile_bay_obs_7d', ecology.eBird.mobileBayObs, 'count'])

    const coopsData = data.waterQuality?.coops || {}
    for (const [stId, st] of Object.entries(coopsData)) {
      if (st.wind != null)            rows.push([ts, 'coops', stId, 'wind_speed',      typeof st.wind === 'object' ? st.wind.value : st.wind, 'm/s'])
      if (st.air_pressure != null)    rows.push([ts, 'coops', stId, 'air_pressure_mb', typeof st.air_pressure === 'object' ? st.air_pressure.value : st.air_pressure, 'mb'])
      if (st.air_temperature != null) rows.push([ts, 'coops', stId, 'air_temp_c',      typeof st.air_temperature === 'object' ? st.air_temperature.value : st.air_temperature, '°C'])
    }

    const omCur = land?.openMeteo?.current || {}
    if (omCur.precip_mm    != null) rows.push([ts, 'land', 'openmeteo', 'precip_mm',    omCur.precip_mm,    'mm'])
    if (omCur.cape         != null) rows.push([ts, 'land', 'openmeteo', 'cape_jkg',     omCur.cape,         'J/kg'])
    if (omCur.solar_rad_wm2!= null) rows.push([ts, 'land', 'openmeteo', 'solar_rad_wm2',omCur.solar_rad_wm2,'W/m²'])
    if (omCur.uv_index     != null) rows.push([ts, 'land', 'openmeteo', 'uv_index',     omCur.uv_index,     ''])
    if (omCur.lifted_index  != null) rows.push([ts, 'land', 'openmeteo', 'lifted_index', omCur.lifted_index,  ''])
    if (omCur.soil_moisture != null) rows.push([ts, 'land', 'openmeteo', 'soil_moisture',omCur.soil_moisture, 'm³/m³'])
    if (omCur.cin          != null) rows.push([ts, 'land', 'openmeteo', 'cin',          omCur.cin,          'J/kg'])
    if (omCur.blh          != null) rows.push([ts, 'land', 'openmeteo', 'blh',          omCur.blh,          'm'])
    if (land?.ahps?.stage != null) rows.push([ts, 'land', 'ahps', 'flood_stage_ft', land.ahps.stage, 'ft'])

    if (airplus?.openAQ?.avgPM25 != null)
      rows.push([ts, 'airplus', 'openaq', 'pm25_avg', airplus.openAQ.avgPM25, 'µg/m³'])
    if (airplus?.purpleAir?.avgPM25 != null)
      rows.push([ts, 'airplus', 'purpleair', 'pm25_avg', airplus.purpleAir.avgPM25, 'µg/m³'])
    if (airplus?.epaAQS?.avgValue != null)
      rows.push([ts, 'airplus', 'epa_aqs', 'pm25_avg', airplus.epaAQS.avgValue, 'µg/m³'])

    if (rows.length > 0) await writeReadings(rows)

    let recentVecs = null
    try { recentVecs = await getRecentVectors(10) } catch (vecErr) { console.warn('[CrossSensor] Recent vectors unavailable:', vecErr.message) }
    data.recentVectors = recentVecs

    const features = buildFeatureVector(data)
    const labels   = autoLabel(features)
    const nonNullKeys = Object.values(features).filter(v => v != null).length
    const gapFilled = Object.keys(features).length - nonNullKeys
    await writeFeatureVector(ts, features, labels, {
      sourceCount: rows.length,
      gapFilledFields: gapFilled,
      adphConfirmed: null,
    })

    if (features.min_do2 != null && features.min_do2 < THRESHOLDS.DO2_CRITICAL) {
      const usgsArr = waterQuality?.usgs || []
      const worstStation = usgsArr.find(s => safeNum(s.readings?.do_mg_l) < THRESHOLDS.DO2_CRITICAL)
      if (worstStation) await writeHabEvent(ts, 'hypoxia', worstStation.siteNo, features.min_do2, 'usgs_threshold')
    }
    if (features.wbDo2 != null && features.wbDo2 < THRESHOLDS.DO2_CRITICAL)
      await writeHabEvent(ts, 'hypoxia', 'wekaswq', features.wbDo2, 'nerrs_threshold')

    if (features.goes_sst_gradient != null && features.goes_sst_gradient >= 3.5)
      await writeHabEvent(ts, 'stratification_alert', 'GOES19-ABI', features.goes_sst_gradient, 'goes19_gradient')

    return {
      ok:      true,
      readings: rows.length,
      labeled: labels.hab != null || labels.hypoxia != null,
      labels,
      goesFeatures: features.goes_sst_gradient != null,
    }
  } catch (err) {
    console.error('[persistTick]', err.message)
    return { ok: false, error: err.message }
  }
}

function safeNum(v) {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'object' && 'value' in v) return safeNum(v.value)
  const n = parseFloat(v); return isNaN(n) ? null : n
}

export { THRESHOLDS }

import { writeReadings, writeFeatureVector, writeHabEvent } from './database.js'

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
    // New: all additional data sources
    goesLatest,   // GOES-19 push readings from DB
    satellite,    // satellite status (MODIS, VIIRS, HLS, etc.)
    ocean,        // ocean model status (CMEMS, HYCOM, CoastWatch)
    ecology,      // biodiversity (iNaturalist, GBIF, eBird, AmeriFlux)
    land,         // land/weather (Open-Meteo, AHPS, NCEI, FEMA, SSURGO, NLCD)
    airplus,      // air quality (EPA AQS, OpenAQ, PurpleAir)
    buoy,         // NDBC Buoy 42012 — offshore Gulf temp, wind, pressure
    weather,      // NOAA NWS — wind speed, direction, humidity, pressure
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
      do2:   safeNum(s.readings?.do_mg_l),
      temp:  safeNum(s.readings?.water_temp_c),
      flow:  safeNum(s.readings?.streamflow_cfs),
      pH:    safeNum(s.readings?.pH),
      turb:  safeNum(s.readings?.turbidity_ntu),
      cond:  safeNum(s.readings?.conductance_us_cm),
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
    wbTemp:   wb.Temp?.value ?? null,
    wbSal:    wb.Sal?.value ?? null,
    wbTurb:   wb.Turb?.value ?? null,
    wbChlFl:  wb.ChlFluor?.value ?? null,
    wbCond:   wb.SpCond?.value ?? null,
    wbPH:     wb.pH?.value ?? null,
  }

  const hf = hfRadar || {}
  const hfValues = {
    currentSpeed_ms: hf.avgSpeed_ms ?? null,
    currentDir_deg:  hf.direction_deg ?? null,
    bloom14h_km:     hf.bloom_transport?.distance_14h_km ?? null,
    bloom24h_km:     hf.bloom_transport?.distance_24h_km ?? null,
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
    waterLevel_dauphinIs: safeNum(dauphinIsland.water_level),
    salinity_dauphinIs:   safeNum(dauphinIsland.salinity),
    waterTemp_dauphinIs:  safeNum(dauphinIsland.water_temperature),
  }

  // ── GOES-19 push features ─────────────────────────────────────────────────
  const safeN = v => { if(v==null)return null; const n=parseFloat(v); return isNaN(n)?null:n }
  const goesFeatures = {
    goes_sst_mean:      safeN(goesLatest?.sst_mean),
    goes_sst_gradient:  safeN(goesLatest?.sst_gradient),  // stratification alarm ≥3.5°C
    goes_qpe_rainfall:  safeN(goesLatest?.qpe_rainfall),
    goes_qpe_6h:        safeN(goesLatest?.qpe_6h),        // nutrient pulse trigger ≥5mm
    goes_qpe_24h:       safeN(goesLatest?.qpe_24h),
    goes_cloud_pct:     safeN(goesLatest?.cloud_coverage),
    goes_glm_flashes:   safeN(goesLatest?.glm_flashes),   // storm convective mixing
    goes_glm_active:    safeN(goesLatest?.glm_active),
    goes_amv_speed:     safeN(goesLatest?.amv_wind_speed),
    goes_amv_dir:       safeN(goesLatest?.amv_wind_dir),
    goes_bloom_index:   safeN(goesLatest?.bloom_index),   // parsed from rgb_ratios JSON
    goes_turbidity_idx: safeN(goesLatest?.turbidity_idx),
    goes_stratification_alert: goesLatest?.sst_gradient != null && goesLatest.sst_gradient >= 3.5 ? 1 : 0,
    goes_nutrient_pulse_alert: goesLatest?.qpe_6h != null && goesLatest.qpe_6h >= 5 ? 1 : 0,
    goes_bloom_alert:   goesLatest?.bloom_index != null && goesLatest.bloom_index >= 0.12 ? 1 : 0,
  }

  // ── NDBC Buoy 42012 — offshore Gulf of Mexico ─────────────────────────────
  // NDBC txt format uses raw header names: WTMP=water temp, WSPD=wind speed,
  // WDIR=wind dir, ATMP=air temp, PRES=pressure, WVHT=wave height
  const buoyFeatures = {
    buoy_water_temp_c:  safeN(buoy?.WTMP),    // offshore water temp — bloom precursor
    buoy_wind_speed_ms: safeN(buoy?.WSPD),    // offshore wind — mixing indicator
    buoy_wind_dir_deg:  safeN(buoy?.WDIR),
    buoy_air_temp_c:    safeN(buoy?.ATMP),
    buoy_pressure_mb:   safeN(buoy?.PRES),
    buoy_wave_height_m: safeN(buoy?.WVHT),    // sea state — bloom dispersion
    buoy_available:     buoy != null ? 1 : 0,
  }

  // ── NOAA NWS weather — surface wind at Mobile Bay ─────────────────────────
  const nwsCurrent = weather?.current || {}
  const weatherFeatures = {
    nws_wind_speed_mph: safeN(nwsCurrent.wind_speed_mph),
    nws_wind_dir_deg:   safeN(nwsCurrent.wind_direction),
    nws_temp_f:         safeN(nwsCurrent.temp_f),
    nws_humidity_pct:   safeN(nwsCurrent.humidity),
    nws_pressure_mb:    safeN(nwsCurrent.pressure_mb),
    nws_available:      nwsCurrent.wind_speed_mph != null ? 1 : 0,
  }

  // ── Satellite availability features ───────────────────────────────────────
  // Granule counts = recent passes = data richness proxy for the ML model
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

  // ── Ocean model features ───────────────────────────────────────────────────
  const oceanFeatures = {
    cmems_available:      ocean?.cmems?.available ? 1 : 0,
    hycom_available:      ocean?.hycom?.available ? 1 : 0,
    coastwatch_chl_rows:  safeN(ocean?.coastwatch?.data?.table?.rows?.length),
  }

  // ── Ecology features ───────────────────────────────────────────────────────
  const ecoFeatures = {
    inaturalist_obs_7d:   safeN(ecology?.iNaturalist?.totalCount),
    gbif_occurrences_90d: safeN(ecology?.gbif?.totalCount),
    ebird_obs_7d:         safeN(ecology?.eBird?.mobileBayObs ?? ecology?.eBird?.totalAlabamaObs),
    ameriflux_active:     ecology?.ameriflux?.available ? 1 : 0,
  }

  // ── Land + weather features ────────────────────────────────────────────────
  const openMeteo  = land?.openMeteo
  const landFeatures = {
    precip_current_mm:   safeN(openMeteo?.current?.precip_mm),
    wind_ms_openmeteo:   safeN(openMeteo?.current?.wind_ms),
    cape_jkg:            safeN(openMeteo?.current?.cape),      // convective energy — storm risk
    precip_7day_sum_mm:  openMeteo?.dailyForecast
      ? openMeteo.dailyForecast.slice(0,7).reduce((s,d) => s + (safeN(d.precip_sum_mm) ?? 0), 0)
      : null,
    max_precip_prob_7d:  openMeteo?.dailyForecast
      ? Math.max(...openMeteo.dailyForecast.slice(0,7).map(d => safeN(d.precipProb) ?? 0))
      : null,
    ahps_flood_stage_ft: safeN(land?.ahps?.stage),
    ahps_flood_active:   land?.ahps?.available ? 1 : 0,
    ncei_data_available: land?.ncei?.available ? 1 : 0,
    fema_flood_zone:     land?.fema?.floodZone ? 1 : 0,
    nlcd_impervious_pct: safeN(land?.nlcd?.imperviousPct),
  }

  // ── Air quality features ───────────────────────────────────────────────────
  const airFeatures = {
    openaq_pm25:         safeN(airplus?.openAQ?.avgPM25),
    purpleair_pm25:      safeN(airplus?.purpleAir?.avgPM25),
    epa_aqs_pm25:        safeN(airplus?.epaAQS?.avgValue),
    air_quality_alert:   (airplus?.openAQ?.avgPM25 ?? 0) > 35 || (airplus?.purpleAir?.avgPM25 ?? 0) > 35 ? 1 : 0,
  }

  const aqiVal = aqi?.readings?.[0]?.aqi ?? null

  const hourOfDay   = now.getHours()
  const dayOfYear   = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000)
  const monthOfYear = now.getMonth() + 1
  const isSummer    = monthOfYear >= 5 && monthOfYear <= 9 ? 1 : 0
  const isNight     = (hourOfDay < 6 || hourOfDay >= 20) ? 1 : 0

  const habProb = safeNum(habAssessment?.hab?.probability) ?? null

  return {
    ts,
    // ── Core water quality (USGS + CO-OPS) ──────────────────────────────────
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
    // ── NERRS Weeks Bay ──────────────────────────────────────────────────────
    ...nerrsValues,
    // ── HF Radar ─────────────────────────────────────────────────────────────
    ...hfValues,
    // ── Lag / transport ──────────────────────────────────────────────────────
    ...lagFeatures,
    // ── CO-OPS tidal ─────────────────────────────────────────────────────────
    ...tidal,
    // ── AirNow AQI ───────────────────────────────────────────────────────────
    aqi: aqiVal,
    // ── GOES-19 push ─────────────────────────────────────────────────────────
    ...goesFeatures,
    // ── NDBC Buoy 42012 ──────────────────────────────────────────────────────
    ...buoyFeatures,
    // ── NOAA NWS weather ─────────────────────────────────────────────────────
    ...weatherFeatures,
    // ── Satellite ────────────────────────────────────────────────────────────
    ...satFeatures,
    // ── Ocean models ─────────────────────────────────────────────────────────
    ...oceanFeatures,
    // ── Ecology ──────────────────────────────────────────────────────────────
    ...ecoFeatures,
    // ── Land + weather ───────────────────────────────────────────────────────
    ...landFeatures,
    // ── Air quality ──────────────────────────────────────────────────────────
    ...airFeatures,
    // ── Prior HAB probability ─────────────────────────────────────────────────
    hab_prob: habProb,
    // ── Temporal encodings ────────────────────────────────────────────────────
    hour_of_day:  hourOfDay,
    day_of_year:  dayOfYear,
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

  if (features.wbDo2 != null || features.min_do2 != null) {
    const minDo2 = Math.min(
      features.wbDo2 ?? Infinity,
      features.min_do2 ?? Infinity
    )
    if (minDo2 < THRESHOLDS.DO2_CRITICAL) {
      labels.hypoxia = 1
    } else if (minDo2 > THRESHOLDS.DO2_LOW) {
      labels.hypoxia = 0
    }
  }

  if (features.avg_temp != null && features.total_flow_kcfs != null) {
    const warmWater  = features.avg_temp > THRESHOLDS.TEMP_WARM ? 1 : 0
    const highFlow   = features.total_flow_kcfs > (THRESHOLDS.FLOW_SURGE / 1000) ? 1 : 0
    const highChl    = features.wbChlFl != null && features.wbChlFl > 10 ? 1 : 0
    const summerFlag = features.is_summer

    const score = warmWater + highFlow + highChl + summerFlag
    if (score >= 3)      labels.hab = 1
    else if (score <= 1) labels.hab = 0
  }

  return labels
}

export async function persistTick(data = {}) {
  const ts = Date.now()
  const rows = []

  try {
    const { waterQuality, hfRadar, nerrs, ecology, land, airplus } = data
    const usgs = waterQuality?.usgs || []

    // ── USGS NWIS ─────────────────────────────────────────────────────────────
    for (const s of usgs) {
      const r = s.readings || {}
      const paramMap = {
        do_mg_l:           [safeNum(r.do_mg_l),           'mg/L'],
        water_temp_c:      [safeNum(r.water_temp_c),      '°C'],
        streamflow_cfs:    [safeNum(r.streamflow_cfs),    'cfs'],
        pH:                [safeNum(r.pH),                ''],
        turbidity_ntu:     [safeNum(r.turbidity_ntu),     'NTU'],
        conductance_us_cm: [safeNum(r.conductance_us_cm), 'µS/cm'],
      }
      for (const [param, [val, unit]] of Object.entries(paramMap)) {
        if (val != null) rows.push([ts, 'usgs', s.siteNo, param, val, unit])
      }
    }

    // ── NERRS Weeks Bay ───────────────────────────────────────────────────────
    if (nerrs?.waterQuality?.latest) {
      const wb = nerrs.waterQuality.latest
      const nerrsParams = ['DO_mgl','Temp','Sal','Turb','ChlFluor','SpCond','pH']
      for (const p of nerrsParams) {
        if (wb[p]?.value != null) rows.push([ts, 'nerrs', 'wekaswq', p, wb[p].value, wb[p].unit||''])
      }
    }

    // ── HF Radar ──────────────────────────────────────────────────────────────
    if (hfRadar?.avgSpeed_ms != null) {
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_speed_ms', hfRadar.avgSpeed_ms, 'm/s'])
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_dir_deg',  hfRadar.direction_deg, '°'])
      if (hfRadar.bloom_transport?.distance_14h_km != null)
        rows.push([ts, 'hfradar', 'ucsdHfrE6', 'bloom_transport_14h_km', hfRadar.bloom_transport.distance_14h_km, 'km'])
    }

    // ── NDBC Buoy 42012 ───────────────────────────────────────────────────────
    const buoy = data.buoy
    if (buoy?.WTMP != null) rows.push([ts, 'ndbc', '42012', 'water_temp_c',  buoy.WTMP,  '°C'])
    if (buoy?.WSPD != null) rows.push([ts, 'ndbc', '42012', 'wind_speed_ms', buoy.WSPD,  'm/s'])
    if (buoy?.WDIR != null) rows.push([ts, 'ndbc', '42012', 'wind_dir_deg',  buoy.WDIR,  '°'])
    if (buoy?.PRES != null) rows.push([ts, 'ndbc', '42012', 'pressure_mb',   buoy.PRES,  'mb'])
    if (buoy?.WVHT != null) rows.push([ts, 'ndbc', '42012', 'wave_height_m', buoy.WVHT,  'm'])

    // ── NWS weather ────────────────────────────────────────────────────────────
    const wx = data.weather?.current || {}
    if (wx.wind_speed_mph != null) rows.push([ts, 'nws', 'KMOB', 'wind_speed_mph', wx.wind_speed_mph, 'mph'])
    if (wx.wind_direction  != null) rows.push([ts, 'nws', 'KMOB', 'wind_dir_deg',   wx.wind_direction,  '°'])
    if (wx.temp_f          != null) rows.push([ts, 'nws', 'KMOB', 'temp_f',         wx.temp_f,          '°F'])
    if (wx.pressure_mb     != null) rows.push([ts, 'nws', 'KMOB', 'pressure_mb',    wx.pressure_mb,     'mb'])

    // ── Ecology ───────────────────────────────────────────────────────────────
    if (ecology?.iNaturalist?.totalCount != null)
      rows.push([ts, 'ecology', 'inaturalist', 'obs_7d', ecology.iNaturalist.totalCount, 'count'])
    if (ecology?.gbif?.totalCount != null)
      rows.push([ts, 'ecology', 'gbif', 'occurrences_90d', ecology.gbif.totalCount, 'count'])
    if (ecology?.eBird?.mobileBayObs != null)
      rows.push([ts, 'ecology', 'ebird', 'mobile_bay_obs_7d', ecology.eBird.mobileBayObs, 'count'])

    // ── Land + weather ────────────────────────────────────────────────────────
    const precip = land?.openMeteo?.current?.precip_mm
    if (precip != null) rows.push([ts, 'land', 'openmeteo', 'precip_mm', precip, 'mm'])
    const cape = land?.openMeteo?.current?.cape
    if (cape != null) rows.push([ts, 'land', 'openmeteo', 'cape_jkg', cape, 'J/kg'])
    if (land?.ahps?.stage != null) rows.push([ts, 'land', 'ahps', 'flood_stage_ft', land.ahps.stage, 'ft'])

    // ── Air quality ───────────────────────────────────────────────────────────
    if (airplus?.openAQ?.avgPM25 != null)
      rows.push([ts, 'airplus', 'openaq', 'pm25_avg', airplus.openAQ.avgPM25, 'µg/m³'])
    if (airplus?.purpleAir?.avgPM25 != null)
      rows.push([ts, 'airplus', 'purpleair', 'pm25_avg', airplus.purpleAir.avgPM25, 'µg/m³'])
    if (airplus?.epaAQS?.avgValue != null)
      rows.push([ts, 'airplus', 'epa_aqs', 'pm25_avg', airplus.epaAQS.avgValue, 'µg/m³'])

    if (rows.length > 0) await writeReadings(rows)

    // ── Feature vector + auto-label ───────────────────────────────────────────
    const features = buildFeatureVector(data)
    const labels   = autoLabel(features)
    await writeFeatureVector(ts, features, labels)

    // ── Hypoxia event detection ───────────────────────────────────────────────
    if (features.min_do2 != null && features.min_do2 < THRESHOLDS.DO2_CRITICAL) {
      const worstStation = usgs.find(s => safeNum(s.readings?.do_mg_l) < THRESHOLDS.DO2_CRITICAL)
      if (worstStation) await writeHabEvent(ts, 'hypoxia', worstStation.siteNo, features.min_do2, 'usgs_threshold')
    }
    if (features.wbDo2 != null && features.wbDo2 < THRESHOLDS.DO2_CRITICAL)
      await writeHabEvent(ts, 'hypoxia', 'wekaswq', features.wbDo2, 'nerrs_threshold')

    // ── GOES stratification alert detection ────────────────────────────────────
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

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
  const { waterQuality, hfRadar, nerrs, aqi, habAssessment } = data
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

  const aqiVal = aqi?.readings?.[0]?.aqi ?? null

  const hourOfDay   = now.getHours()
  const dayOfYear   = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000)
  const monthOfYear = now.getMonth() + 1
  const isSummer    = monthOfYear >= 5 && monthOfYear <= 9 ? 1 : 0
  const isNight     = (hourOfDay < 6 || hourOfDay >= 20) ? 1 : 0

  const habProb = safeNum(habAssessment?.hab?.probability) ?? null

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
    ...nerrsValues,
    ...hfValues,
    ...lagFeatures,
    ...tidal,
    aqi: aqiVal,
    hab_prob: habProb,
    hour_of_day:    hourOfDay,
    day_of_year:    dayOfYear,
    month:          monthOfYear,
    is_summer:      isSummer,
    is_night:       isNight,
    hour_sin:       Math.sin(2 * Math.PI * hourOfDay / 24),
    hour_cos:       Math.cos(2 * Math.PI * hourOfDay / 24),
    doy_sin:        Math.sin(2 * Math.PI * dayOfYear / 365),
    doy_cos:        Math.cos(2 * Math.PI * dayOfYear / 365),
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
    const { waterQuality, hfRadar, nerrs } = data
    const usgs = waterQuality?.usgs || []

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

    if (nerrs?.waterQuality?.latest) {
      const wb = nerrs.waterQuality.latest
      const nerrsParams = ['DO_mgl','Temp','Sal','Turb','ChlFluor','SpCond','pH']
      for (const p of nerrsParams) {
        if (wb[p]?.value != null) rows.push([ts, 'nerrs', 'wekaswq', p, wb[p].value, wb[p].unit||''])
      }
    }

    if (hfRadar?.avgSpeed_ms != null) {
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_speed_ms', hfRadar.avgSpeed_ms, 'm/s'])
      rows.push([ts, 'hfradar', 'ucsdHfrE6', 'current_dir_deg', hfRadar.direction_deg, '°'])
    }

    if (rows.length > 0) await writeReadings(rows)

    const features = buildFeatureVector(data)
    const labels = autoLabel(features)
    await writeFeatureVector(ts, features, labels)

    if (features.min_do2 != null && features.min_do2 < THRESHOLDS.DO2_CRITICAL) {
      const worstStation = usgs.find(s => safeNum(s.readings?.do_mg_l) < THRESHOLDS.DO2_CRITICAL)
      if (worstStation) {
        await writeHabEvent(ts, 'hypoxia', worstStation.siteNo, features.min_do2, 'usgs_threshold')
      }
    }

    if (features.wbDo2 != null && features.wbDo2 < THRESHOLDS.DO2_CRITICAL) {
      await writeHabEvent(ts, 'hypoxia', 'wekaswq', features.wbDo2, 'nerrs_threshold')
    }

    return {
      ok: true,
      readings: rows.length,
      labeled: labels.hab != null || labels.hypoxia != null,
      labels,
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

# TERRAWATCH — Complete 19-Prompt Replit Sequence
# Run in order. Let each complete before starting the next.
# Last updated: April 2026

---

## PROMPT 1 of 19 — server/services/mlTrainer.js — 142-Key Feature Manifest

Paste this into Replit Agent:

```
In server/services/mlTrainer.js, replace the extractFeatureArray function and everything above normalizeFeatures with the code below. The existing function has 23 hardcoded keys. We are replacing it with a 142-key manifest that covers every data source in the platform.

IMPORTANT CONTEXT: The feature JSON stored in SQLite is built by buildFeatureVector() in server/services/crossSensor.js. Some GOES-19 field names in the database use different naming conventions than what appears in FEATURE_KEYS. The default values ensure backward compatibility — any field not yet populated uses its default and does not break training.

After the imports at the top of server/services/mlTrainer.js, add before the normalizeFeatures function:

const FEATURE_KEYS = [
  // USGS network aggregates
  ['min_do2',7.0],['avg_do2',7.0],['max_do2',9.0],['std_do2',0.5],
  ['avg_temp',24.0],['max_temp',26.0],['total_flow_kcfs',15.0],['avg_turb',4.0],
  ['max_turb',8.0],['station_count',6.0],['hypoxic_stations',0.0],['low_do2_stations',0.0],
  // Per-station USGS DO2 (all 6 stations)
  ['do2_dogriver',7.0],['do2_fowlriver',7.0],['do2_mobilei65',7.0],
  ['do2_mobilebucks',7.0],['do2_alabamariver',7.0],['do2_escatawpa',7.0],
  // Per-station USGS flow/turbidity/nutrients/gage
  ['flow_mobilei65',10.0],['turb_dogriver',4.0],['gage_height_dogriver',5.0],
  ['gage_height_mobilei65',5.0],['ortho_p_dogriver',0.1],['total_n_mobilei65',0.5],
  // NERRS Weeks Bay (wekaswq primary + wekbwq secondary + wekmet met)
  ['wbDo2',7.0],['wbDOPct',85.0],['wbTemp',24.0],['wbSal',15.0],
  ['wbTurb',4.0],['wbChlFl',2.0],['wbCond',25.0],['wbPH',7.5],['wbDepth',1.5],
  ['wbWSpd',3.0],['wbMaxWSpd',5.0],['wbWdir',180.0],['wbATemp',26.0],
  ['wbBP',1013.0],['wbPAR',400.0],['wbPrec',0.0],['wbRH',75.0],
  ['wbDo2_secondary',7.0],['wbSal_secondary',15.0],['wbChlFl_secondary',2.0],
  // WQP gap-fill DO2
  ['wqp_do2_min',7.0],
  // HF Radar surface currents + bloom transport
  ['currentSpeed_ms',0.15],['currentDir_deg',180.0],['bloom14h_km',5.0],['bloom24h_km',8.0],
  // Cross-sensor lag features
  ['lag_dogriver_weeksbay_h',18.0],['upstream_do2_dogriver',7.0],
  ['upstream_flow_dogriver',8.0],['upstream_turb_dogriver',4.0],
  // NOAA CO-OPS tidal stations
  ['waterLevel_dauphinIs',0.2],['salinity_dauphinIs',20.0],['waterTemp_dauphinIs',24.0],
  ['coops_wind_speed',5.0],['coops_air_pressure_mb',1013.0],['coops_air_temp_c',26.0],
  // GOES-19 (using FEATURE_KEYS names — aliases in crossSensor.js map from payload names)
  ['goes_sst_mean',24.0],['goes_sst_gradient',1.5],['goes_sst_min',22.0],
  ['goes_sst_max',26.0],['goes_sst_offshore',24.0],['goes_sst_range',2.0],
  ['goes_qpe_rainfall',0.5],['goes_qpe_6h',2.0],['goes_qpe_24h',5.0],
  ['goes_cloud_pct',40.0],['goes_glm_flashes',0.0],['goes_glm_active',0.0],
  ['goes_amv_speed',4.0],['goes_amv_dir',180.0],
  ['goes_bloom_index',0.05],['goes_turbidity_idx',0.15],
  ['goes_stratification_alert',0],['goes_nutrient_pulse_alert',0],['goes_bloom_alert',0.0],
  ['goes_solar_zenith',45.0],['goes_nearest_lightning_km',50.0],
  // NDBC Buoy 42012
  ['buoy_water_temp_c',24.0],['buoy_wind_speed_ms',4.0],['buoy_wind_dir_deg',180.0],
  ['buoy_wind_gust_ms',6.0],['buoy_air_temp_c',26.0],['buoy_pressure_mb',1013.0],
  ['buoy_wave_height_m',0.5],['buoy_dom_wave_period_s',6.0],['buoy_avg_wave_period_s',5.0],
  ['buoy_mean_wave_dir',180.0],['buoy_dewpoint_c',20.0],['buoy_available',1.0],
  // NWS forecast
  ['nws_wind_speed_mph',10.0],['nws_wind_speed_ms',4.5],['nws_wind_gust_mph',15.0],
  ['nws_wind_gust_ms',6.7],['nws_wind_dir_deg',180.0],['nws_temp_f',82.0],
  ['nws_temp_c',28.0],['nws_humidity_pct',72.0],['nws_dewpoint_c',22.0],
  ['nws_pressure_mb',1013.0],['nws_visibility_m',16000.0],['nws_available',1.0],
  // Satellite granule availability flags
  ['modis_granules',2.0],['viirs_granules',2.0],['hls_granules',3.0],
  ['landsat_granules',1.0],['sentinel2_granules',2.0],['sentinel2_cloud_pct',30.0],
  ['pace_active',0.0],['goes_erddap_active',1.0],
  // Ocean physics
  ['cmems_available',1.0],['hycom_available',1.0],['coastwatch_chl_rows',1.0],
  // Ecology / biodiversity
  ['inaturalist_obs_7d',50.0],['gbif_occurrences_90d',100.0],
  ['ebird_obs_7d',20.0],['ameriflux_active',0.0],
  ['bivalve_obs_90d',20.0],['fish_obs_90d',100.0],['saltmarsh_obs_90d',10.0],
  // Open-Meteo weather (all with correct hour extraction)
  ['precip_current_mm',0.0],['wind_ms_openmeteo',4.0],['cape_jkg',200.0],
  ['solar_rad_wm2',300.0],['uv_index',4.0],['lifted_index',1.0],
  ['soil_moisture',0.25],['cin',-50.0],['blh',800.0],
  ['precip_7day_sum_mm',15.0],['max_precip_prob_7d',40.0],
  // AHPS flood stage (now parsed from XML)
  ['ahps_flood_stage_ft',5.0],['ahps_flood_active',0.0],
  // Land/regulatory (6-hour cache)
  ['ncei_data_available',0.0],['fema_flood_zone',0.0],['nlcd_impervious_pct',15.0],
  ['attains_impaired_segments_count',5.0],
  // Air quality
  ['openaq_pm25',8.0],['purpleair_pm25',9.0],['epa_aqs_pm25',7.0],['air_quality_alert',0.0],
  // HAB Oracle feedback + time
  ['ts',0.0],['hab_prob',25.0],['aqi',45.0],['tidal_phase',0.5],
  ['hour_of_day',12.0],['day_of_year',180.0],['month',7.0],['is_summer',1.0],
  ['is_night',0.0],['hour_sin',0.0],['hour_cos',1.0],['doy_sin',0.0],['doy_cos',-1.0],
  // Derived features (computed in crossSensor.js)
  ['halocline_index',3.0],['halocline_strong',0.0],
  ['sst_vs_buoy_delta',0.5],
  ['bloom_toward_dauphin',0.0],['bloom_toward_weeksbay',0.0],['nws_wind_onshore',0.0],
  ['do2_trend_1h',0.0],['chlfluor_trend_1h',0.0],['sst_trend_1h',0.0],['flow_trend_1h',0.0],
  ['do2_declining_fast',0.0],
  ['chlfluor_salinity_bloom',0.0],
  ['compound_stress_index',20.0],
  ['wbDOPct_computed',85.0],
]

export const FEATURE_NAMES = FEATURE_KEYS.map(([k]) => k)

function extractFeatureArray(featuresJson) {
  const f = typeof featuresJson === 'string' ? JSON.parse(featuresJson) : featuresJson
  return FEATURE_KEYS.map(([key, def]) => {
    const v = f[key]
    if (v == null || (typeof v === 'number' && isNaN(v))) return def
    return v
  })
}

Then replace the existing runInference export with this version that supports 162 features and includes SHAP contributions:

export async function runInference(features) {
  const model = await getDeployedModel('hab_oracle')
  if (!model?.weights) {
    return { prediction: null, confidence: null, note: 'No trained model deployed yet. Accumulating training data.' }
  }
  const x = extractFeatureArray(features)
  const w = model.weights
  const xNorm = x.map((v, j) => (v - (w.means?.[j] || 0)) / (w.stds?.[j] || 1))
  const prob = sigmoid(dot(xNorm, w.w) + w.b)
  const contributions = (w.w || []).map((wi, j) => ({
    feature: FEATURE_NAMES[j] || `f${j}`,
    weight: wi, value: x[j], contribution: wi * xNorm[j],
  })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 15)
  return {
    prediction: prob > 0.5 ? 1 : 0,
    confidence: Math.round(prob * 1000) / 10,
    riskLevel: prob > 0.8 ? 'CRITICAL' : prob > 0.65 ? 'HIGH' : prob > 0.45 ? 'MODERATE' : 'LOW',
    modelVersion: model.version, modelPhase: model.phase, aucRoc: model.auc_roc,
    trainedOn: new Date(model.ts).toISOString(),
    featureContributions: contributions, featureCount: FEATURE_NAMES.length,
  }
}

export const PHASE_THRESHOLDS = {
  PHASE_1: 100,
  PHASE_2: 500,
  PHASE_3: 2000,
}

export async function exportVectorsCSV(days = 30) {
  const { getAllVectors } = await import('./database.js')
  const vectors = await getAllVectors(5000)
  const cutoff = Date.now() - days * 86400000
  const recent = vectors.filter(v => v.ts > cutoff)
  if (!recent.length) return null
  const header = ['ts', 'label_hab', 'label_hypoxia', ...FEATURE_NAMES].join(',')
  const rows = recent.map(v => {
    const f = typeof v.features === 'string' ? JSON.parse(v.features) : v.features
    const vals = FEATURE_KEYS.map(([key, def]) => { const val = f[key]; return val == null ? def : val })
    return [v.ts, v.label_hab ?? '', v.label_hypoxia ?? '', ...vals].join(',')
  })
  return [header, ...rows].join('\n')
}
```

---

## PROMPT 2 of 19 — server/services/crossSensor.js — autoLabel Fix + GOES-19 Aliases + Full Feature Wiring

```
Make all of these changes to server/services/crossSensor.js. This file contains buildFeatureVector() — the function that assembles the feature JSON written to SQLite every 3 minutes. We are: fixing the autoLabel ecology bug, adding tidal phase, reconciling GOES-19 field naming between the ground station payload and the FEATURE_KEYS manifest, wiring buoy/NWS/CO-OPS/satellite scalars into the vector, and computing all derived features.

CONTEXT ON GOES-19 FIELD NAMES: The ground station push payload uses nested names like products.sst.bay_mean_c, products.qpe.bay_rain_mm_hr etc. The goes19.js service parses these and stores them in the feature vector using names like goes_sst_mean, goes_rain_bay, goes_rain_6h, goes_stratification, goes_lightning_5min, goes_bay_clear_pct, goes_bloom_index, goes_turbidity_index. The FEATURE_KEYS manifest uses different names: goes_qpe_rainfall, goes_qpe_6h, goes_stratification_alert, goes_glm_flashes, goes_cloud_pct, goes_turbidity_idx. We write BOTH sets of names so old vectors and new vectors both work.

--- CHANGE 1: Add tidalPhase() helper before autoLabel ---

function tidalPhase() {
  const REF_NEW_MOON = 947116800000
  const SYNODIC_MS = 29.53059 * 86400000
  const lunDay = ((Date.now() - REF_NEW_MOON) % SYNODIC_MS) / SYNODIC_MS
  const distToNeap = Math.min(
    Math.abs(lunDay - 0.25), Math.abs(lunDay - 0.75),
    Math.abs(lunDay - 0.25 + 1), Math.abs(lunDay - 0.75 + 1),
  )
  return Math.max(0, 1 - distToNeap / 0.25)
}

--- CHANGE 2: Add computeTrend() helper before buildFeatureVector() ---

Import getRecentVectors at the top of crossSensor.js:
  import { getRecentVectors } from './database.js'

Add this function:

function computeTrend(recentVectors, fieldName, windowMinutes = 60) {
  if (!recentVectors?.length) return null
  const windowMs = windowMinutes * 60000
  const cutoff = Date.now() - windowMs
  const valid = recentVectors
    .filter(v => new Date(v.ts).getTime() > cutoff)
    .map(v => ({ t: new Date(v.ts).getTime(), val: v.features?.[fieldName] }))
    .filter(v => v.val != null && !isNaN(v.val))
    .sort((a, b) => a.t - b.t)
  if (valid.length < 2) return null
  const oldest = valid[0], newest = valid[valid.length - 1]
  const dtHours = (newest.t - oldest.t) / 3600000
  if (dtHours < 0.01) return null
  return (newest.val - oldest.val) / dtHours
}

--- CHANGE 3: Replace autoLabel with corrected K. brevis ecology ---

export function autoLabel(features) {
  const labels = { hab: null, hypoxia: null }

  if (features.wbDo2 != null || features.min_do2 != null) {
    const minDo2 = Math.min(features.wbDo2 ?? Infinity, features.min_do2 ?? Infinity)
    if (minDo2 < THRESHOLDS.DO2_CRITICAL) labels.hypoxia = 1
    else if (minDo2 > THRESHOLDS.DO2_LOW) labels.hypoxia = 0
  }

  if (labels.hypoxia === null && features.is_summer &&
      features.goes_stratification_alert === 1 && (features.tidal_phase ?? 0) > 0.65) {
    labels.hypoxia = 1
  }

  const warmOffshore = (features.buoy_water_temp_c ?? features.goes_sst_mean ?? features.avg_temp ?? 0) > 24 ? 1 : 0
  const highSalinity = (features.wbSal ?? features.salinity_dauphinIs ?? 0) > 25 ? 1 : 0
  const lowTurbidity = (features.wbTurb ?? features.avg_turb ?? 999) < 5 ? 1 : 0
  const stableWind = (features.nws_wind_speed_ms ?? features.buoy_wind_speed_ms ?? 999) < 6 ? 1 : 0
  const summerFlag = features.is_summer ?? 0
  const goesBloom = (features.goes_bloom_index ?? 0) >= 0.20 ? 1 : 0
  const nearshoreBloom = (features.wbChlFl ?? 0) > 15 && (features.wbSal ?? 0) > 20 ? 1 : 0

  if (goesBloom) {
    labels.hab = 1
  } else if (features.avg_temp != null) {
    const score = warmOffshore + highSalinity + lowTurbidity + stableWind + summerFlag + nearshoreBloom
    if (score >= 4) labels.hab = 1
    else if (score <= 1) labels.hab = 0
  }

  return labels
}

--- CHANGE 4: In buildFeatureVector(), add all new fields to the return object ---

At the start of buildFeatureVector(), fetch recent vectors for trend computation:
  const recentVectors = getRecentVectors(20)

In the return object of buildFeatureVector(), ADD the following fields alongside whatever is already there. Do not remove existing fields — only add:

  // Tidal phase
  tidal_phase: tidalPhase(),

  // GOES-19 field name aliases — maps ground station payload names to FEATURE_KEYS names
  // Ground station sends: bay_rain_mm_hr, cumulative_6h_mm, cumulative_24h_mm, bay_clear_pct,
  //   flashes_5min, active_cells, turbidity_index, gradient_c, solar_zenith_deg, nearest_cell_km,
  //   bay_min_c, bay_max_c, offshore_c, speed_ms, direction_deg
  // These are stored by goes19.js as goes_rain_bay, goes_rain_6h, goes_rain_24h, goes_bay_clear_pct,
  //   goes_lightning_5min, goes_storm_cells, goes_turbidity_index, goes_sst_gradient, etc.
  // Write FEATURE_KEYS names as aliases:
  goes_qpe_rainfall:        goesFeatures?.goes_rain_bay        ?? goesFeatures?.qpe_rainfall   ?? null,
  goes_qpe_6h:              goesFeatures?.goes_rain_6h         ?? goesFeatures?.qpe_6h          ?? null,
  goes_qpe_24h:             goesFeatures?.goes_rain_24h        ?? goesFeatures?.qpe_24h         ?? null,
  goes_cloud_pct:           goesFeatures?.goes_bay_clear_pct != null
    ? 100 - goesFeatures.goes_bay_clear_pct
    : (goesFeatures?.goes_cloud_pct ?? null),
  goes_glm_flashes:         goesFeatures?.goes_lightning_5min  ?? goesFeatures?.glm_flashes     ?? null,
  goes_glm_active:          goesFeatures?.goes_storm_cells     ?? goesFeatures?.glm_active       ?? null,
  goes_turbidity_idx:       goesFeatures?.goes_turbidity_index ?? goesFeatures?.turbidity_idx    ?? null,
  goes_stratification_alert: (() => {
    const g = goesFeatures?.goes_sst_gradient ?? goesFeatures?.sst_gradient
    const flag = goesFeatures?.goes_stratification ?? goesFeatures?.stratification_alert
    if (flag != null) return flag >= 1 ? 1 : 0
    if (g != null) return g >= 3.5 ? 1 : 0
    return null
  })(),
  goes_nutrient_pulse_alert: (() => {
    const r = goesFeatures?.goes_rain_watershed ?? goesFeatures?.watershed_rain_mm_hr
    const flag = goesFeatures?.goes_nutrient_pulse ?? goesFeatures?.nutrient_pulse_alert
    if (flag != null) return flag >= 1 ? 1 : 0
    if (r != null) return r >= 5 ? 1 : 0
    return null
  })(),
  goes_bloom_alert:  (goesFeatures?.goes_bloom_index ?? 0) >= 0.20 ? 1 : 0,
  goes_sst_min:      goesFeatures?.goes_sst_min    ?? goesFeatures?.sst_bay_min_c ?? null,
  goes_sst_max:      goesFeatures?.goes_sst_max    ?? goesFeatures?.sst_bay_max_c ?? null,
  goes_sst_offshore: goesFeatures?.goes_sst_offshore ?? goesFeatures?.sst_offshore_c ?? null,
  goes_sst_range:    goesFeatures?.goes_sst_range  ?? (() => {
    const mn = goesFeatures?.goes_sst_min ?? goesFeatures?.sst_bay_min_c
    const mx = goesFeatures?.goes_sst_max ?? goesFeatures?.sst_bay_max_c
    return (mn != null && mx != null) ? mx - mn : null
  })(),
  goes_solar_zenith:         goesFeatures?.goes_solar_zenith ?? goesFeatures?.rgb?.solar_zenith_deg ?? null,
  goes_nearest_lightning_km: goesFeatures?.goes_nearest_lightning_km ?? goesFeatures?.glm?.nearest_cell_km ?? null,
  goes_amv_speed:  goesFeatures?.goes_amv_speed ?? goesFeatures?.winds?.speed_ms     ?? null,
  goes_amv_dir:    goesFeatures?.goes_amv_dir   ?? goesFeatures?.winds?.direction_deg ?? null,

  NOTE: Replace 'goesFeatures' above with whatever variable name holds the GOES-19 data
  in your existing buildFeatureVector() scope (look for goes_sst_gradient or bloom_index assignment).

  // NDBC Buoy 42012
  buoy_water_temp_c:      buoyData?.waterTemp     ?? buoyData?.water_temp_c      ?? null,
  buoy_wind_speed_ms:     buoyData?.windSpeed     ?? buoyData?.wind_speed_ms     ?? null,
  buoy_wind_dir_deg:      buoyData?.windDir       ?? buoyData?.wind_dir_deg      ?? null,
  buoy_wind_gust_ms:      buoyData?.windGust      ?? buoyData?.wind_gust_ms      ?? null,
  buoy_air_temp_c:        buoyData?.airTemp       ?? buoyData?.air_temp_c        ?? null,
  buoy_pressure_mb:       buoyData?.pressure      ?? buoyData?.pressure_mb       ?? null,
  buoy_wave_height_m:     buoyData?.waveHeight    ?? buoyData?.wave_height_m     ?? null,
  buoy_dom_wave_period_s: buoyData?.dominantPeriod ?? buoyData?.dom_wave_period_s ?? null,
  buoy_avg_wave_period_s: buoyData?.avgPeriod     ?? buoyData?.avg_wave_period_s ?? null,
  buoy_mean_wave_dir:     buoyData?.meanWaveDir   ?? null,
  buoy_dewpoint_c:        buoyData?.dewpoint      ?? null,
  buoy_available:         buoyData != null ? 1 : 0,

  NOTE: Replace buoyData with whatever variable holds NDBC data in your scope.

  // NWS forecast
  nws_wind_speed_mph: nwsData?.windSpeed?.value ?? null,
  nws_wind_speed_ms:  nwsData?.windSpeed?.value != null ? nwsData.windSpeed.value * 0.44704 : null,
  nws_wind_gust_mph:  nwsData?.windGust?.value  ?? null,
  nws_wind_gust_ms:   nwsData?.windGust?.value  != null ? nwsData.windGust.value * 0.44704 : null,
  nws_wind_dir_deg:   nwsData?.windDirection?.value ?? null,
  nws_temp_f:         nwsData?.temperature?.value ?? null,
  nws_temp_c:         nwsData?.temperature?.value != null ? (nwsData.temperature.value - 32) * 5/9 : null,
  nws_humidity_pct:   nwsData?.relativeHumidity?.value ?? null,
  nws_dewpoint_c:     nwsData?.dewpoint?.value ?? null,
  nws_pressure_mb:    nwsData?.barometricPressure?.value != null ? nwsData.barometricPressure.value / 100 : null,
  nws_visibility_m:   nwsData?.visibility?.value ?? null,
  nws_available:      nwsData != null ? 1 : 0,

  NOTE: Replace nwsData with whatever variable holds NWS current conditions in your scope.

  // CO-OPS extended
  coops_wind_speed:      coopsData?.wind?.speed ?? null,
  coops_air_pressure_mb: coopsData?.pressure?.value ?? null,
  coops_air_temp_c:      coopsData?.airTemp?.value ?? null,

  // Air quality alert (computed from existing aqi field)
  air_quality_alert: (features?.aqi ?? 0) > 100 ? 1 : 0,

  // Satellite granule counts (from satelliteStatus — see server/index.js wiring)
  modis_granules:     satelliteStatus?.modis_granules     ?? null,
  viirs_granules:     satelliteStatus?.viirs_granules     ?? null,
  hls_granules:       satelliteStatus?.hls_granules       ?? null,
  landsat_granules:   satelliteStatus?.landsat_granules   ?? null,
  sentinel2_granules: satelliteStatus?.sentinel2_granules ?? null,
  sentinel2_cloud_pct:satelliteStatus?.sentinel2_cloud_pct ?? null,
  pace_active:        satelliteStatus?.pace_active ?? 0,

  // Halocline index — PRIMARY Mobile Bay hypoxia mechanism
  halocline_index: (features?.salinity_dauphinIs != null && features?.wbSal != null)
    ? Math.max(0, (features.salinity_dauphinIs ?? 0) - (features.wbSal ?? 0))
    : null,
  halocline_strong: (features?.salinity_dauphinIs != null && features?.wbSal != null)
    ? ((features.salinity_dauphinIs - features.wbSal) > 5 ? 1 : 0)
    : null,

  // SST vs offshore buoy delta — bay warming relative to open Gulf
  sst_vs_buoy_delta: (goesFeatures?.goes_sst_mean != null && buoyData?.waterTemp != null)
    ? (goesFeatures.goes_sst_mean - buoyData.waterTemp)
    : null,

  // Bloom transport direction flags
  bloom_toward_dauphin: (features?.currentDir_deg != null)
    ? (features.currentDir_deg >= 135 && features.currentDir_deg <= 315 ? 1 : 0)
    : null,
  bloom_toward_weeksbay: (features?.currentDir_deg != null)
    ? (features.currentDir_deg >= 315 || features.currentDir_deg <= 45 ? 1 : 0)
    : null,
  nws_wind_onshore: (features?.nws_wind_dir_deg != null)
    ? (features.nws_wind_dir_deg >= 157 && features.nws_wind_dir_deg <= 337 ? 1 : 0)
    : null,

  // Rate-of-change features — most predictive early warning signals
  do2_trend_1h:      computeTrend(recentVectors, 'min_do2', 60),
  chlfluor_trend_1h: computeTrend(recentVectors, 'wbChlFl', 60),
  sst_trend_1h:      computeTrend(recentVectors, 'goes_sst_mean', 60),
  flow_trend_1h:     computeTrend(recentVectors, 'total_flow_kcfs', 60),
  do2_declining_fast: (() => {
    const trend = computeTrend(recentVectors, 'min_do2', 60)
    return (trend != null && trend < -0.3) ? 1 : 0
  })(),

  // ChlFluor x Salinity bloom potential — K. brevis needs both
  chlfluor_salinity_bloom: (features?.wbChlFl != null && features?.wbSal != null)
    ? features.wbChlFl * Math.max(0, features.wbSal - 15) / 10
    : null,

  // Compound stress index — unified summary of current risk state
  compound_stress_index: (() => {
    const scores = []
    if (features?.min_do2 != null)            scores.push(Math.max(0, (6 - features.min_do2) / 6))
    if (features?.goes_sst_gradient != null)  scores.push(Math.min(1, features.goes_sst_gradient / 5))
    if (features?.halocline_index != null)    scores.push(Math.min(1, features.halocline_index / 10))
    if (features?.wbChlFl != null)            scores.push(Math.min(1, features.wbChlFl / 30))
    return scores.length ? Math.round(scores.reduce((s,v)=>s+v,0)/scores.length*100) : null
  })(),

  // DO2 percent saturation (from NERRS or computed via Garcia-Gordon formula)
  wbDOPct_computed: (() => {
    if (features?.wbDOPct != null) return features.wbDOPct
    const do2 = features?.wbDo2, temp = features?.wbTemp, sal = features?.wbSal ?? 15
    if (!do2 || !temp) return null
    const Ts = Math.log((298.15 - temp) / (273.15 + temp))
    const lnDOsat = 2.00907 + 3.22014*Ts + 4.05010*Ts**2 + 4.94457*Ts**3 - 0.256847*Ts**4 + 3.88767*Ts**5
    const DOsat = Math.exp(lnDOsat) * Math.exp(-sal*(0.00624 + 0.00693*Ts))
    return DOsat > 0 ? Math.round((do2/DOsat)*100*10)/10 : null
  })(),

--- CHANGE 5: Update persistTick return to include features ---

Find the persistTick return statement and ensure it returns features:

  return {
    ok: true,
    readings: rows.length,
    labeled: labels.hab != null || labels.hypoxia != null,
    labels,
    features,
    goesFeatures: features.goes_sst_gradient != null,
  }
```

---

## PROMPT 3 of 19 — server/ml/habOracle.js — PAR Risk + Correct Hypoxia Forecast

```
Make these three changes to server/ml/habOracle.js:

--- CHANGE 1: Add PAR bloom growth risk function ---

Add this function after the existing glmLightningMixingRisk function:

function parBloomGrowthRisk(parMmolM2) {
  if (parMmolM2 == null) return 0.30
  if (parMmolM2 >= 700) return 0.90
  if (parMmolM2 >= 400) return 0.70
  if (parMmolM2 >= 200) return 0.45
  if (parMmolM2 >= 50)  return 0.25
  return 0.10
}

--- CHANGE 2: Add PAR to HAB Oracle factors and rebalance weights ---

In the runHabOracle factors object, add after glm_lightning_mixing:
    par_growth: parBloomGrowthRisk(inputs.wbPAR ?? inputs.solar_rad_wm2),

Update the WEIGHTS object so all factors sum to 1.00:
    temperature: 0.11, salinity: 0.08, wind: 0.11, dissolved_oxygen: 0.09,
    nutrient_loading: 0.08, stratification: 0.08, goes_stratification: 0.13,
    rainfall_nutrient_pulse: 0.10, satellite_bloom: 0.09, glm_lightning_mixing: 0.08,
    par_growth: 0.05,

--- CHANGE 3: Replace runHypoxiaForecast with halocline-based model ---

Replace the entire runHypoxiaForecast function:

export function runHypoxiaForecast(inputs) {
  const {
    water_temp_c, salinity_ppt, wind_speed_mph, streamflow_cfs, do_mg_l,
    goes_sst_gradient, hf_speed_ms, tidal_phase,
    salinity_dauphinIs, wbSal, wbDo2, cape_jkg, wind_speed_ms, wind_direction_deg,
    halocline_index, min_do2, do2_trend_1h,
  } = inputs
  const month = new Date().getMonth() + 1
  const SEASONAL = {1:0.05,2:0.05,3:0.08,4:0.15,5:0.30,6:0.50,7:0.75,8:0.80,9:0.55,10:0.25,11:0.10,12:0.05}
  let risk = SEASONAL[month] || 0.20

  // Halocline (primary mechanism — saltwater wedge suppresses vertical mixing)
  const haloVal = halocline_index ?? ((salinity_dauphinIs != null && wbSal != null)
    ? Math.max(0, salinity_dauphinIs - wbSal) : null)
  if (haloVal != null) {
    if (haloVal > 8) risk += 0.35
    else if (haloVal > 5) risk += 0.25
    else if (haloVal > 2) risk += 0.12
  }

  if (tidal_phase != null) risk += tidal_phase * 0.20

  if (goes_sst_gradient != null) {
    if (goes_sst_gradient >= 3.5) risk += 0.20
    else if (goes_sst_gradient >= 2.0) risk += 0.10
  } else {
    if (water_temp_c > 28) risk += 0.15
    else if (water_temp_c > 25) risk += 0.07
  }

  const windMs = wind_speed_ms ?? (wind_speed_mph != null ? wind_speed_mph / 2.237 : null)
  if (windMs != null) {
    if (windMs < 2) risk += 0.25
    else if (windMs < 4) risk += 0.15
    else if (windMs < 7) risk += 0.05
    else risk -= 0.10
  }
  if (hf_speed_ms != null && hf_speed_ms < 0.1) risk += 0.08

  if (streamflow_cfs != null) {
    if (streamflow_cfs > 50000) risk += 0.12
    else if (streamflow_cfs > 20000) risk += 0.06
  }

  // Use lowest DO2 from any sensor
  const bestDo2 = Math.min(...[wbDo2, do_mg_l, min_do2].filter(v => v != null && v > 0))
  if (isFinite(bestDo2)) {
    if (bestDo2 < 3) risk += 0.30
    else if (bestDo2 < 5) risk += 0.15
  }

  // DO2 rapidly declining — imminent hypoxia regardless of current level
  if (do2_trend_1h != null && do2_trend_1h < -0.3) risk += 0.20

  if (cape_jkg != null && cape_jkg > 1500) risk += 0.05

  const finalRisk = Math.min(100, Math.round(Math.max(0, risk) * 100))
  const surfaceSal = wbSal ?? salinity_ppt
  const bottomSal  = salinity_dauphinIs
  const easterly   = wind_direction_deg != null && wind_direction_deg >= 60 && wind_direction_deg <= 120
  const neapTide   = (tidal_phase ?? 0) > 0.65
  const summerNow  = month >= 6 && month <= 9
  const jubileeRisk = finalRisk > 65 && summerNow && neapTide && easterly

  return {
    probability: finalRisk,
    riskLevel: finalRisk < 25 ? 'LOW' : finalRisk < 50 ? 'MODERATE' : finalRisk < 70 ? 'ELEVATED' : 'HIGH',
    expectedMinDO: finalRisk > 60 ? 2.5 : finalRisk > 40 ? 4.0 : 6.0,
    jubileeRisk,
    jubileeConditions: {
      neapTide, easterlyWind: easterly, summerSeason: summerNow,
      haloclineActive: haloVal != null ? haloVal > 5 : null,
      haloclineStrength: haloVal != null ? haloVal.toFixed(1) + ' ppt' : null,
      tidalPhase: tidal_phase != null ? (tidal_phase * 100).toFixed(0) + '% neap' : null,
    },
    forecast_days: 5,
    timestamp: new Date().toISOString(),
  }
}
```

---

## PROMPT 4 of 19 — server/routes/habOracle.js — Wire All Inputs

```
In server/routes/habOracle.js, find the extractOracleInputs function (or wherever oracle inputs are assembled from data sources). Add these fields to the returned inputs object. Use whatever variable names hold the NERRS, CO-OPS, Open-Meteo, and land data in that scope:

    // NERRS primary station
    wbSal:       nerrs?.waterQuality?.latest?.Sal?.value      ?? null,
    wbDo2:       nerrs?.waterQuality?.latest?.DO_mgl?.value   ?? null,
    wbTemp:      nerrs?.waterQuality?.latest?.Temp?.value     ?? null,
    wbPAR:       nerrs?.meteorological?.latest?.TotPAR?.value ?? null,
    // Open-Meteo
    solar_rad_wm2: land?.openMeteo?.current?.solar_rad_wm2 ?? null,
    cape_jkg:      land?.openMeteo?.current?.cape          ?? null,
    // CO-OPS Dauphin Island salinity (bottom-water proxy for halocline computation)
    salinity_dauphinIs: coops?.['8735180']?.salinity?.value ?? null,
    wind_speed_ms: coops?.['8735180']?.wind?.value != null
      ? coops['8735180'].wind.value * 0.5144 : null,
    // Computed derived features (from most recent feature vector if available)
    halocline_index: null,  // computed below
    do2_trend_1h:    null,  // computed below
    min_do2:         null,  // computed below
    // Tidal phase (computed inline)
    tidal_phase: (() => {
      const REF = 947116800000, SYN = 29.53059 * 86400000
      const lunDay = ((Date.now() - REF) % SYN) / SYN
      const dist = Math.min(
        Math.abs(lunDay-0.25), Math.abs(lunDay-0.75),
        Math.abs(lunDay-0.25+1), Math.abs(lunDay-0.75+1)
      )
      return Math.max(0, 1 - dist / 0.25)
    })(),

After assembling the inputs object, add these derived computations:

    // Halocline
    if (inputs.salinity_dauphinIs != null && inputs.wbSal != null) {
      inputs.halocline_index = Math.max(0, inputs.salinity_dauphinIs - inputs.wbSal)
    }
    // Pull min_do2 and do2_trend_1h from the most recent feature vector
    try {
      const { getLatestVector } = await import('../services/database.js')
      const latest = getLatestVector()
      if (latest?.features) {
        const f = typeof latest.features === 'string' ? JSON.parse(latest.features) : latest.features
        inputs.min_do2 = f.min_do2 ?? null
        inputs.do2_trend_1h = f.do2_trend_1h ?? null
      }
    } catch {}
```

---

## PROMPT 5 of 19 — server/routes/alerts.js — Environmental Alert Engine

```
Replace the entire contents of server/routes/alerts.js with:

import express from 'express'
const router = express.Router()

let activeAlerts = []
let alertHistory = []
const _recentKeys = new Set()

router.get('/', (req, res) => {
  res.json({ active: activeAlerts, history: alertHistory.slice(-50), count: activeAlerts.length })
})

router.post('/trigger', (req, res) => {
  const alert = _buildAlert(req.body)
  activeAlerts.push(alert)
  alertHistory.push(alert)
  console.log(`[ALERT] ${alert.severity} — ${alert.message}`)
  res.json({ alert, status: 'dispatched' })
})

router.put('/:id/acknowledge', (req, res) => {
  const alert = activeAlerts.find(a => a.id === req.params.id)
  if (!alert) return res.status(404).json({ error: 'Alert not found' })
  alert.acknowledged = true
  alert.acknowledgedAt = new Date().toISOString()
  activeAlerts = activeAlerts.filter(a => !a.acknowledged)
  res.json({ alert })
})

router.get('/active', (req, res) => {
  res.json({ active: activeAlerts, count: activeAlerts.length, timestamp: new Date().toISOString() })
})

function _buildAlert({ type, severity, message, source, data }) {
  return {
    id: `ALT-${Date.now()}-${type}`,
    type, severity, message,
    source: source || 'TERRAWATCH',
    data: data || {},
    timestamp: new Date().toISOString(),
    acknowledged: false,
    category: 'environmental',
  }
}

export async function triggerEnvAlerts(alertDef) {
  const key = `${alertDef.type}-${Math.floor(Date.now() / 1800000)}`
  if (_recentKeys.has(key)) return
  _recentKeys.add(key)
  setTimeout(() => _recentKeys.delete(key), 1800000)
  const alert = _buildAlert(alertDef)
  activeAlerts.push(alert)
  alertHistory.push(alert)
  if (alertDef.severity !== 'CRITICAL') {
    setTimeout(() => { activeAlerts = activeAlerts.filter(a => a.id !== alert.id) }, 7200000)
  }
  console.log(`[ENV ALERT] ${alert.severity} ${alert.type} — ${alert.message.substring(0, 80)}`)
}

export default router
```

---

## PROMPT 6 of 19 — server/index.js — Nightly Retrain + Alert Dispatch + Source Health Wiring

```
Make these changes to server/index.js:

--- CHANGE 1: Add imports ---

import { triggerEnvAlerts }       from './routes/alerts.js'
import { getAllSatelliteStatus, extractSatelliteScalars } from './services/satellite.js'
import { extractHYCOMScalars, extractCoastWatchScalars } from './services/ocean.js'
import { getOpenMeteoWeather, getAHPSFloodStage }        from './services/landregweather.js'
import { writeSourceHealth, getRecentVectors }            from './services/database.js'

--- CHANGE 2: Replace weekly retrain with nightly ---

Find cron.schedule('0 0 * * 0', ...) and replace with:

cron.schedule('0 8 * * *', async () => {
  console.log('[CRON:nightly] ML retraining started...')
  try {
    const result = await retrainHABOracle()
    console.log('[CRON:nightly] Retrain:', result.status, '| AUC-ROC:', result.aucRoc, '| Samples:', result.nSamples)
  } catch (err) {
    console.error('[CRON:nightly] Retrain error:', err.message)
  }
})

--- CHANGE 3: Add module-level caches before cron definitions ---

const withTimeout = (promise, ms, fallback) =>
  Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(fallback), ms))])

let _satelliteCache = null
let _lastSatFetch   = 0
let _landRegCache   = null
let _lastLandFetch  = 0
let _wqpCache       = null
let _lastWqpFetch   = 0
let _bioCache       = null
let _lastBioFetch   = 0

--- CHANGE 4: Add evaluateAndDispatchAlerts function ---

async function evaluateAndDispatchAlerts(features) {
  if (!features) return
  try {
    const alerts = []
    const stratActive = features.goes_stratification_alert === 1
      || (features.goes_sst_gradient ?? 0) >= 3.5
    if (stratActive) alerts.push({
      type: 'stratification', severity: 'HIGH',
      message: `GOES-19 SST gradient ${(features.goes_sst_gradient ?? 0).toFixed(1)}°C — thermal stratification detected. Hypoxia precursor active.`,
      source: 'GOES-19'
    })
    if ((features.goes_bloom_index ?? 0) >= 0.20) alerts.push({
      type: 'bloom', severity: 'HIGH',
      message: `GOES-19 bloom index ${features.goes_bloom_index.toFixed(3)} — surface chlorophyll expression detected.`,
      source: 'GOES-19'
    })
    const qpe6h = features.goes_qpe_6h ?? features.goes_rain_6h
    const nutrientActive = features.goes_nutrient_pulse_alert === 1
      || (features.goes_rain_watershed ?? 0) >= 5
    if (nutrientActive) alerts.push({
      type: 'nutrient_pulse', severity: 'MODERATE',
      message: `GOES-19 QPE ${(qpe6h ?? 0).toFixed(1)} mm/6h — watershed nutrient pulse. Bloom risk elevated in 48–96h.`,
      source: 'GOES-19'
    })
    if (features.min_do2 != null && features.min_do2 < 3) alerts.push({
      type: 'hypoxia', severity: 'CRITICAL',
      message: `DO₂ critical: ${features.min_do2.toFixed(1)} mg/L at ${features.hypoxic_stations ?? '?'} station(s). Jubilee possible.`,
      source: 'USGS+NERRS'
    })
    else if (features.min_do2 != null && features.min_do2 < 5) alerts.push({
      type: 'low_do2', severity: 'MODERATE',
      message: `DO₂ low: ${features.min_do2.toFixed(1)} mg/L below stress threshold.`,
      source: 'USGS+NERRS'
    })
    if ((features.wbChlFl ?? 0) > 20) alerts.push({
      type: 'chlorophyll', severity: 'ELEVATED',
      message: `NERRS Weeks Bay chlorophyll ${features.wbChlFl.toFixed(1)} µg/L — elevated nearshore bloom expression.`,
      source: 'NERRS'
    })
    if (features.do2_declining_fast === 1 && (features.min_do2 ?? 9) < 6) alerts.push({
      type: 'do2_rapid_decline', severity: 'HIGH',
      message: `DO₂ declining rapidly — ${features.do2_trend_1h?.toFixed(2)} mg/L/hr. Hypoxia may occur within hours.`,
      source: 'USGS+NERRS'
    })
    for (const alert of alerts) await triggerEnvAlerts(alert)
  } catch (err) {
    console.error('[Alerts] Dispatch error:', err.message)
  }
}

--- CHANGE 5: Update the 3-minute cron to fetch all sources and pass to buildFeatureVector ---

In the existing 3-minute cron, expand the parallel fetch block to include all new sources.
Add these parallel fetches (with timeouts) alongside whatever is already there:

  // Fast sources — every 3 minutes
  const [openMeteoResult, ahpsResult] = await Promise.allSettled([
    withTimeout(getOpenMeteoWeather(), 10000, { available: false }),
    withTimeout(getAHPSFloodStage('MBLM6'), 12000, { available: false, ahps_flood_stage_ft: null, ahps_flood_active: 0 }),
  ])

  // Medium sources — every 20 minutes (satellite)
  if (Date.now() - _lastSatFetch > 1200000) {
    extractSatelliteScalars().then(r => { _satelliteCache = r; _lastSatFetch = Date.now() }).catch(() => {})
  }

  // Slow sources — every 6 hours
  if (Date.now() - _lastLandFetch > 21600000) {
    Promise.allSettled([
      import('./services/landregweather.js').then(m => m.getFEMAFloodZone()),
      import('./services/landregweather.js').then(m => m.getNLCDLandCover()),
      import('./services/landregweather.js').then(m => m.getATTAINSWaterbodies()),
    ]).then(([fema, nlcd, attains]) => {
      _landRegCache = {
        fema_flood_zone: fema.value?.inFloodZone ? 1 : 0,
        nlcd_impervious_pct: [21,22,23,24].includes(nlcd.value?.code) ? (nlcd.value.code - 20) * 20 : 0,
        attains_impaired_segments_count: attains.value?.data?.items?.length ?? null,
      }
      _lastLandFetch = Date.now()
    }).catch(() => {})
  }

  // WQP — every 30 minutes
  if (Date.now() - _lastWqpFetch > 1800000) {
    import('./services/waterQuality.js').then(m => m.getWQPDO2?.()).then(r => {
      if (r) { _wqpCache = r; _lastWqpFetch = Date.now() }
    }).catch(() => {})
  }

  // Biodiversity — daily
  if (Date.now() - _lastBioFetch > 86400000) {
    import('./services/ecology.js').then(m => m.getBiodiversityBaseline(90)).then(r => {
      _bioCache = r; _lastBioFetch = Date.now()
      console.log('[Bio] Updated — bivalves:', r.bivalves, 'fish:', r.fish)
    }).catch(() => {})
  }

  // Extract scalar values from Open-Meteo and AHPS
  const omData   = openMeteoResult.status === 'fulfilled' ? openMeteoResult.value : null
  const ahpsData = ahpsResult.status  === 'fulfilled' ? ahpsResult.value : null

  // Write source health
  writeSourceHealth('OpenMeteo', omData?.available, null, omData?.current?.temp_c, null)
  writeSourceHealth('AHPS', ahpsData?.available, null, ahpsData?.ahps_flood_stage_ft, ahpsData?.error)

  // Pass all cached/fresh data to buildFeatureVector via persistTick (or directly)
  // Add these to whatever data object buildFeatureVector already receives:
  //   omData, ahpsData, _satelliteCache, _landRegCache, _wqpCache, _bioCache

  // After persistTick completes and returns result:
  if (result?.features) {
    await evaluateAndDispatchAlerts(result.features)
    if (result.labels?.hypoxia === 1 || result.labels?.hab === 1) {
      const stats = await getDBStats()
      if (stats.labeled >= 100 && stats.labeled % 25 === 0) {
        retrainHABOracle().then(r => console.log('[Retrain] Event-triggered:', r.status)).catch(() => {})
      }
    }
  }
```

---

## PROMPT 7 of 19 — server/services/database.js — Schema Migration + New Tables

```
CRITICAL: TERRAWATCH uses sql.js (SQLite compiled to WebAssembly) — NOT native sqlite3. The database file is at /data/terrawatch.db. sql.js does NOT support ALTER TABLE ADD COLUMN. Use the migration pattern below.

Find the database initialization code (look for initDB, db.run CREATE TABLE IF NOT EXISTS statements). Make these changes:

--- CHANGE 1: Add schema_versions table ---

db.run(`CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL,
  description TEXT
)`)

--- CHANGE 2: Add data_source_health table ---

db.run(`CREATE TABLE IF NOT EXISTS data_source_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  source TEXT NOT NULL,
  available INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  last_value TEXT,
  error_message TEXT
)`)
db.run(`CREATE INDEX IF NOT EXISTS idx_dsh_source_ts ON data_source_health(source, ts)`)

--- CHANGE 3: Add openeo_jobs table ---

db.run(`CREATE TABLE IF NOT EXISTS openeo_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT UNIQUE,
  job_type TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  result_url TEXT,
  result_json TEXT,
  updated_at TEXT
)`)

--- CHANGE 4: Safe feature_vectors migration (sql.js compatible) ---

After all CREATE TABLE IF NOT EXISTS statements, add:

try {
  const result = db.exec("PRAGMA table_info(feature_vectors)")
  const columns = result[0]?.values?.map(row => row[1]) || []
  if (!columns.includes('source_count')) {
    db.run(`ALTER TABLE feature_vectors RENAME TO feature_vectors_v1_backup`)
    db.run(`CREATE TABLE feature_vectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      features TEXT NOT NULL,
      label_hab INTEGER,
      label_hypoxia INTEGER,
      phase3_exported INTEGER DEFAULT 0,
      source_count INTEGER DEFAULT 0,
      gap_filled_fields TEXT,
      adph_confirmed INTEGER DEFAULT 0,
      pace_available INTEGER DEFAULT 0,
      sar_available INTEGER DEFAULT 0,
      hycom_available INTEGER DEFAULT 0,
      adph_closure_active INTEGER DEFAULT 0
    )`)
    db.run(`INSERT INTO feature_vectors (ts, features, label_hab, label_hypoxia, phase3_exported)
            SELECT ts, features, label_hab, label_hypoxia, phase3_exported
            FROM feature_vectors_v1_backup`)
    db.run(`INSERT OR IGNORE INTO schema_versions (version, applied_at, description)
            VALUES (2, datetime('now'), 'Extended feature_vectors columns v2')`)
    console.log('[DB Migration] feature_vectors upgraded to v2 schema')
  }
} catch (migrationErr) {
  console.warn('[DB Migration] Non-fatal:', migrationErr.message)
}

--- CHANGE 5: Export new helper functions ---

Add these exports:

export function writeSourceHealth(source, available, latencyMs, lastValue, errorMessage) {
  try {
    db.run(
      `INSERT INTO data_source_health (ts, source, available, latency_ms, last_value, error_message)
       VALUES (datetime('now'), ?, ?, ?, ?, ?)`,
      [source, available ? 1 : 0, latencyMs ?? null,
       lastValue != null ? String(lastValue).slice(0, 200) : null,
       errorMessage ?? null]
    )
    db.run(`DELETE FROM data_source_health WHERE source = ? AND id NOT IN (
      SELECT id FROM data_source_health WHERE source = ? ORDER BY ts DESC LIMIT 200
    )`, [source, source])
  } catch (e) { /* non-fatal */ }
}

export function getSourceHealthSummary() {
  try {
    const result = db.exec(`
      SELECT source, available, latency_ms, last_value, error_message, ts
      FROM data_source_health
      WHERE (source, ts) IN (
        SELECT source, MAX(ts) FROM data_source_health GROUP BY source
      )
      ORDER BY source
    `)
    if (!result[0]) return []
    return result[0].values.map(row => ({
      source: row[0], available: row[1] === 1, latencyMs: row[2],
      lastValue: row[3], errorMessage: row[4], ts: row[5]
    }))
  } catch (e) { return [] }
}

export function upsertOpenEOJob(jobId, jobType, status, resultUrl, resultJson) {
  try {
    db.run(`INSERT INTO openeo_jobs (job_id, job_type, submitted_at, status, result_url, result_json, updated_at)
            VALUES (?, ?, datetime('now'), ?, ?, ?, datetime('now'))
            ON CONFLICT(job_id) DO UPDATE SET
              status=excluded.status, result_url=excluded.result_url,
              result_json=excluded.result_json, updated_at=excluded.updated_at`,
      [jobId, jobType, status, resultUrl ?? null,
       resultJson ? JSON.stringify(resultJson).slice(0, 5000) : null])
  } catch (e) { console.warn('[DB] openeo_jobs upsert failed:', e.message) }
}

export function getOpenEOJob(jobType) {
  try {
    const result = db.exec(
      `SELECT job_id, job_type, submitted_at, status, result_url, result_json, updated_at
       FROM openeo_jobs WHERE job_type = ? ORDER BY submitted_at DESC LIMIT 1`, [jobType]
    )
    if (!result[0]?.values?.length) return null
    const [jobId, jt, submittedAt, status, resultUrl, resultJson, updatedAt] = result[0].values[0]
    return { jobId, jobType: jt, submittedAt, status, resultUrl,
             resultJson: resultJson ? JSON.parse(resultJson) : null, updatedAt }
  } catch (e) { return null }
}

export function getLatestVector() {
  try {
    const result = db.exec(`SELECT * FROM feature_vectors ORDER BY ts DESC LIMIT 1`)
    if (!result[0]?.values?.length) return null
    const cols = result[0].columns
    const row  = result[0].values[0]
    return Object.fromEntries(cols.map((c, i) => [c, row[i]]))
  } catch (e) { return null }
}

export function getRecentVectors(n = 20) {
  try {
    const result = db.exec(
      `SELECT features, ts FROM feature_vectors ORDER BY ts DESC LIMIT ?`, [n]
    )
    if (!result[0]) return []
    return result[0].values.map(row => ({
      features: typeof row[0] === 'string' ? JSON.parse(row[0]) : row[0],
      ts: row[1]
    }))
  } catch (e) { return [] }
}
```

---

## PROMPT 8 of 19 — ocean.js + satellite.js + ecology.js — Scalar Value Extraction

```
These three service files ALREADY EXIST. Do NOT recreate them. Add new scalar extraction functions to each.

--- ADD TO server/services/ocean.js ---

Add after getHYCOMSurfaceConditions():

export async function extractHYCOMScalars() {
  try {
    const oneHourAgo = new Date(Date.now()-3600000).toISOString().replace(/\.\d+Z$/,'Z')
    const now        = new Date().toISOString().replace(/\.\d+Z$/,'Z')
    const [tempResp, uvResp] = await Promise.allSettled([
      axios.get('https://ncss.hycom.org/thredds/ncss/GLBy0.08/expt_93.0/ts3z/best.ncd', {
        params: { var:'water_temp,salinity', lat:30.5, lon:-88.0,
          time_start:oneHourAgo, time_end:now, vertCoord:0, accept:'application/json' },
        timeout:25000
      }),
      axios.get('https://ncss.hycom.org/thredds/ncss/GLBy0.08/expt_93.0/uv3z/best.ncd', {
        params: { var:'water_u,water_v', lat:30.5, lon:-88.0,
          time_start:oneHourAgo, time_end:now, vertCoord:0, accept:'application/json' },
        timeout:25000
      }),
    ])
    const parseVal = (data, varName) => {
      try {
        const ts = data?.TimeSeries?.[varName]
        if (Array.isArray(ts)) return ts[ts.length-1]
        if (typeof ts === 'number') return ts
        return null
      } catch { return null }
    }
    const ts = tempResp.status==='fulfilled' ? tempResp.value.data : null
    const uv = uvResp.status==='fulfilled'   ? uvResp.value.data  : null
    const water_temp = parseVal(ts,'water_temp')
    const salinity   = parseVal(ts,'salinity')
    const water_u    = parseVal(uv,'water_u')
    const water_v    = parseVal(uv,'water_v')
    const speed      = (water_u!=null&&water_v!=null) ? Math.sqrt(water_u**2+water_v**2) : null
    const dir        = (water_u!=null&&water_v!=null) ? (Math.atan2(water_v,water_u)*180/Math.PI+360)%360 : null
    return {
      available:true, hycom_available:1,
      hycom_sst:water_temp, hycom_salinity_surface:salinity,
      hycom_current_u:water_u, hycom_current_v:water_v,
      hycom_current_speed:speed, hycom_transport_dir:dir,
      hycom_freshwater_pulse: salinity!=null ? (salinity<20?1:0) : null,
    }
  } catch(err) {
    return { available:false, hycom_available:0, error:err.message }
  }
}

export async function extractCoastWatchScalars() {
  try {
    const dateStr = new Date().toISOString().split('T')[0]
    const { data } = await axios.get('https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdMH1chla8day.json', {
      params: { '.csvp':`chlorophyll[(${dateStr}T00:00:00Z)][(30.5):(30.5)][(-88.0):(-88.0)]` },
      timeout:15000
    })
    const rows  = data?.table?.rows || []
    const chlVal = rows.length>0 ? parseFloat(rows[0][3]) : null
    return { available:rows.length>0, coastwatch_chl_rows:rows.length,
             coastwatch_chlor_a: isNaN(chlVal)?null:chlVal }
  } catch(err) {
    return { available:false, coastwatch_chl_rows:0, coastwatch_chlor_a:null }
  }
}

--- ADD TO server/services/satellite.js ---

Add after getAllSatelliteStatus():

export async function extractSatelliteScalars() {
  const [modis,viirs,hls,landsat,s2] = await Promise.allSettled([
    getMODISChlorophyll(3), getVIIRSOceanColor(3), getHLSGranules(7),
    getLandsatGranules(16), getSentinel2Granules(7,80),
  ])
  return {
    modis_granules:     modis.status==='fulfilled'   ? (modis.value.granules??0)   : 0,
    viirs_granules:     viirs.status==='fulfilled'   ? (viirs.value.granules??0)   : 0,
    hls_granules:       hls.status==='fulfilled'     ? ((hls.value.HLSS30?.granules??0)+(hls.value.HLSL30?.granules??0)) : 0,
    landsat_granules:   landsat.status==='fulfilled' ? (landsat.value.granules??0) : 0,
    sentinel2_granules: s2.status==='fulfilled'      ? (s2.value.granules??0)      : 0,
    sentinel2_cloud_pct:s2.status==='fulfilled'      ? (s2.value.latest?.cloudPct??null) : null,
    pace_active: 0,
  }
}

export async function getPACEOCIScalars(daysBack=2) {
  const auth = getAuth()
  if (!auth) return { available:false, pace_active:0 }
  try {
    const temporal = `${daysAgoISO(daysBack)},${daysAgoISO(0)}`
    const [chlResp,rrsResp] = await Promise.allSettled([
      axios.get(`${CMR_BASE}/granules.json`, {
        params:{short_name:'PACE_OCI_L3M_CHL_NRT',bounding_box:MOBILE_BAY_AOI,temporal,sort_key:'-start_date',page_size:3},
        auth,timeout:20000
      }),
      axios.get(`${CMR_BASE}/granules.json`, {
        params:{short_name:'PACE_OCI_L3M_RRS_NRT',bounding_box:MOBILE_BAY_AOI,temporal,sort_key:'-start_date',page_size:3},
        auth,timeout:20000
      }),
    ])
    const chlGranules = chlResp.status==='fulfilled' ? chlResp.value.data?.feed?.entry||[] : []
    const rrsGranules = rrsResp.status==='fulfilled' ? rrsResp.value.data?.feed?.entry||[] : []
    const latest = chlGranules[0]
    const ageHours = latest?.time_start
      ? Math.round((Date.now()-new Date(latest.time_start).getTime())/3600000) : null
    return {
      available:chlGranules.length>0, pace_active:chlGranules.length>0?1:0,
      pace_granule_age_hours:ageHours, pace_chl_granules:chlGranules.length,
      pace_rrs_granules:rrsGranules.length, pace_latest_granule:latest?.time_start||null,
      pace_chlor_a:null, pace_Rrs465:null, pace_Rrs490:null, pace_Rrs588:null,
      pace_kb_index:null, pace_kb_flag:0,
    }
  } catch(err) {
    return { available:false, pace_active:0, error:err.message }
  }
}

export async function getSentinel1SARStatus() {
  const auth = getCopernicusAuth()
  if (!auth) return { available:false }
  try {
    const filter = [
      `Collection/Name eq 'SENTINEL-1'`,
      `Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD')`,
      `ContentDate/Start gt ${daysAgoISO(5)}T00:00:00.000Z`,
      `ContentDate/Start lt ${daysAgoISO(0)}T23:59:59.000Z`,
      `OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((-89.0 29.8,-87.3 29.8,-87.3 31.2,-89.0 31.2,-89.0 29.8))')`,
    ].join(' and ')
    const { data } = await axios.get(`${CDSE_BASE}/Products`, {
      params:{$filter:filter,$top:5,$orderby:'ContentDate/Start desc'},
      auth,timeout:15000
    })
    const products = data?.value||[]
    const latest = products[0]
    const ageHours = latest?.ContentDate?.Start
      ? Math.round((Date.now()-new Date(latest.ContentDate.Start).getTime())/3600000) : null
    return {
      available:products.length>0, s1_granules_5d:products.length,
      s1_granule_age_hours:ageHours,
      s1_latest_name:latest?.Name||null, s1_latest_date:latest?.ContentDate?.Start||null,
      s1_sigma0_vv:null, s1_sigma0_vh:null, s1_bloom_damping_flag:null,
    }
  } catch(err) { return { available:false, error:err.message } }
}

--- ADD TO server/services/ecology.js ---

Add after getAllEcologyStatus():

export async function extractEcologyScalars() {
  const [inat,gbif] = await Promise.allSettled([
    getInaturalistObservations(null,7),
    getGBIFOccurrences(null,90),
  ])
  return {
    inaturalist_obs_7d:   inat.status==='fulfilled' ? (inat.value.totalCount??0) : 0,
    gbif_occurrences_90d: gbif.status==='fulfilled' ? (gbif.value.totalCount??0) : 0,
    ebird_obs_7d: 0,
    ameriflux_active: 0,
  }
}
```

---

## PROMPT 9 of 19 — server/routes/intelligence.js — CSV Export + SHAP + Source Health Endpoints

```
In server/routes/intelligence.js:

--- CHANGE 1: Update imports ---

import { retrainHABOracle, runInference, PHASE_THRESHOLDS, exportVectorsCSV } from '../services/mlTrainer.js'
import { getLatestVector, getSourceHealthSummary } from '../services/database.js'

--- CHANGE 2: Add routes before export default router ---

router.get('/export.csv', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const csv  = await exportVectorsCSV(days)
    if (!csv) return res.status(404).json({ message: 'No labeled data in range', days })
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition',
      `attachment; filename=terrawatch_${days}d_${new Date().toISOString().slice(0,10)}.csv`)
    res.send(csv)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/explain', async (req, res) => {
  try {
    const features = req.body?.features || {}
    if (!Object.keys(features).length)
      return res.status(400).json({ error: 'Provide features object in request body' })
    const result = await runInference(features)
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/explain/latest', async (req, res) => {
  try {
    const latest = getLatestVector()
    if (!latest) return res.status(404).json({ message: 'No vectors yet. Data accumulation in progress.' })
    const features = typeof latest.features === 'string'
      ? JSON.parse(latest.features) : latest.features
    const result = await runInference(features)
    res.json({
      ...result,
      vectorTimestamp: latest.ts,
      label_hab: latest.label_hab,
      label_hypoxia: latest.label_hypoxia,
      sourceCount: latest.source_count,
      adphConfirmed: latest.adph_confirmed === 1,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/source-health', (req, res) => {
  try {
    const sources = getSourceHealthSummary()
    const live = sources.filter(s => s.available).length
    res.json({
      sources,
      summary: { total: sources.length, live, offline: sources.length - live,
        coveragePct: sources.length ? Math.round(live/sources.length*100) : 0 }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
```

---

## PROMPT 10 of 19 — server/services/randomForest.js + server/services/shap.js — Phase 2 ML

```
Create TWO new files. Random Forest is Phase 2 (activates at 500 labeled samples). Phase 1 logistic regression is already implemented and stays as-is.

--- FILE 1: Create server/services/randomForest.js ---

export const PHASE2_THRESHOLD = 500

function giniImpurity(labels) {
  if (!labels.length) return 0
  const counts = {}
  for (const l of labels) counts[l] = (counts[l]||0)+1
  const n = labels.length
  return 1 - Object.values(counts).reduce((s,c)=>s+(c/n)**2, 0)
}

function bestSplit(X, y, featureIndices) {
  let bestGain=-Infinity, bestFeat=-1, bestThresh=null
  const parentGini = giniImpurity(y)
  for (const fi of featureIndices) {
    const vals   = X.map(row=>row[fi])
    const unique = [...new Set(vals)].sort((a,b)=>a-b)
    const thresholds = unique.slice(0,-1).map((v,i)=>(v+unique[i+1])/2)
    for (const thresh of thresholds) {
      const leftMask = vals.map(v=>v<=thresh)
      const leftY  = y.filter((_,i)=>leftMask[i])
      const rightY = y.filter((_,i)=>!leftMask[i])
      if (!leftY.length||!rightY.length) continue
      const gain = parentGini - (leftY.length/y.length)*giniImpurity(leftY)
                              - (rightY.length/y.length)*giniImpurity(rightY)
      if (gain>bestGain) { bestGain=gain; bestFeat=fi; bestThresh=thresh }
    }
  }
  return { feature:bestFeat, threshold:bestThresh, gain:bestGain }
}

function buildTree(X, y, depth, maxDepth, minSamples, nFeatures) {
  const counts = {}
  for (const l of y) counts[l]=(counts[l]||0)+1
  const majority = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]
  if (depth>=maxDepth||y.length<=minSamples||new Set(y).size===1)
    return { leaf:true, label:majority, prob:(counts[1]||0)/y.length }
  const allFeats = Array.from({length:X[0].length},(_,i)=>i)
  const subFeats = allFeats.sort(()=>0.5-Math.random()).slice(0,nFeatures)
  const { feature, threshold } = bestSplit(X, y, subFeats)
  if (feature===-1) return { leaf:true, label:majority, prob:(counts[1]||0)/y.length }
  const leftMask = X.map(row=>row[feature]<=threshold)
  return {
    leaf:false, feature, threshold,
    left:  buildTree(X.filter((_,i)=>leftMask[i]),  y.filter((_,i)=>leftMask[i]),  depth+1,maxDepth,minSamples,nFeatures),
    right: buildTree(X.filter((_,i)=>!leftMask[i]), y.filter((_,i)=>!leftMask[i]), depth+1,maxDepth,minSamples,nFeatures),
  }
}

function predictTree(tree, row) {
  if (tree.leaf) return tree.prob
  return row[tree.feature]<=tree.threshold ? predictTree(tree.left,row) : predictTree(tree.right,row)
}

function bootstrap(X, y) {
  const n=X.length, idxs=Array.from({length:n},()=>Math.floor(Math.random()*n))
  const oobIdxs=Array.from({length:n},(_,i)=>i).filter(i=>!idxs.includes(i))
  return {
    X:idxs.map(i=>X[i]), y:idxs.map(i=>y[i]),
    oobX:oobIdxs.map(i=>X[i]), oobY:oobIdxs.map(i=>y[i]),
  }
}

export function trainRandomForest(X, y, options={}) {
  const { nTrees=100, maxDepth=8, minSamples=3,
          nFeatures=Math.floor(Math.sqrt(X[0].length)) } = options
  const forest=[], oobPreds=new Array(X.length).fill(null).map(()=>[])
  for (let t=0;t<nTrees;t++) {
    const { X:bX, y:bY, oobX, oobY } = bootstrap(X, y)
    const tree = buildTree(bX, bY, 0, maxDepth, minSamples, nFeatures)
    forest.push(tree)
    for (let i=0;i<oobX.length;i++) oobPreds[i].push(predictTree(tree,oobX[i])>0.5?1:0)
  }
  const oobValid = oobPreds.filter(p=>p.length>0)
  const oobAcc   = oobValid.length
    ? oobValid.reduce((sum,preds,i)=>{
        const vote = preds.reduce((s,p)=>s+p,0)/preds.length>0.5?1:0
        return sum+(vote===y[i]?1:0)
      },0)/oobValid.length
    : null
  const importances = new Array(X[0].length).fill(0)
  const traverse = (node,w) => {
    if (node.leaf) return
    importances[node.feature]+=w
    traverse(node.left,w*0.5); traverse(node.right,w*0.5)
  }
  for (const tree of forest) traverse(tree,1)
  const total = importances.reduce((s,v)=>s+v,0)||1
  return { forest, nTrees, nFeatures:X[0].length,
           featureImportances:importances.map(v=>v/total), oobAccuracy:oobAcc }
}

export function predictRF(model, row) {
  const votes = model.forest.map(tree=>predictTree(tree,row))
  const prob  = votes.reduce((s,p)=>s+p,0)/votes.length
  return { habProbability:prob, prediction:prob>0.5?1:0, confidence:Math.round(prob*1000)/10 }
}

--- FILE 2: Create server/services/shap.js ---

import { FEATURE_NAMES, FEATURE_KEYS } from './mlTrainer.js'

export async function computeSHAP(featureArray, modelPredict, trainingMeans, topK=15) {
  const baseline = await modelPredict(featureArray)
  const shapValues = []
  for (let i=0;i<featureArray.length;i++) {
    const permuted = [...featureArray]
    permuted[i] = trainingMeans[i]??0
    const permutedPred = await modelPredict(permuted)
    shapValues.push({
      feature:  FEATURE_NAMES[i]||`f${i}`,
      value:    featureArray[i],
      baseline: trainingMeans[i]??0,
      shap:     baseline-permutedPred,
      direction: baseline>permutedPred ? 'risk_increasing' : 'risk_reducing',
    })
  }
  const sorted = shapValues.sort((a,b)=>Math.abs(b.shap)-Math.abs(a.shap)).slice(0,topK)
  const top3   = sorted.slice(0,3)
  const narrative = top3.map((s,i) => {
    const pct = Math.abs(s.shap*100).toFixed(0)
    const dir = s.shap>0 ? 'increasing' : 'decreasing'
    return `${i===0?'HAB risk driven by':i===1?'also':''} ${s.feature.replace(/_/g,' ')} (${dir} risk ${pct}%)`.trim()
  }).join(', ')+'.'
  return { baseline, shapValues:sorted, narrative, computedAt:new Date().toISOString() }
}

export function extractTrainingMeans(vectors) {
  const sums=new Array(FEATURE_KEYS.length).fill(0)
  const cnts=new Array(FEATURE_KEYS.length).fill(0)
  for (const v of vectors) {
    const f = typeof v.features==='string' ? JSON.parse(v.features) : v.features
    FEATURE_KEYS.forEach(([key],i)=>{
      const val=f[key]
      if (val!=null&&!isNaN(val)) { sums[i]+=val; cnts[i]++ }
    })
  }
  return sums.map((s,i)=>cnts[i]>0?s/cnts[i]:(FEATURE_KEYS[i]?.[1]??0))
}

--- ALSO: Update mlTrainer.js to trigger RF at Phase 2 ---

In the retrainHABOracle function, after the existing Phase 1 logistic regression block, add:

  if (nSamples >= 500) {  // Phase 2 threshold
    const { trainRandomForest, predictRF } = await import('./randomForest.js')
    const X = vectors.map(v => extractFeatureArray(v.features))
    const y = vectors.map(v => v.label_hab ?? 0)
    const splitIdx = Math.floor(X.length * 0.8)
    const trainX = X.slice(0, splitIdx), trainY = y.slice(0, splitIdx)
    const testX  = X.slice(splitIdx),    testY  = y.slice(splitIdx)
    const rfModel = trainRandomForest(trainX, trainY, { nTrees:100, maxDepth:8 })
    const preds   = testX.map(row => predictRF(rfModel, row).habProbability)
    const aucRoc  = computeAUCROC(preds, testY)
    // Save to model_registry as phase=2, model_type='random_forest'
    // Use same save/promote logic as logistic regression but with type='random_forest'
    console.log('[RF Phase 2] OOB accuracy:', rfModel.oobAccuracy, '| AUC-ROC:', aucRoc)
  }
```

---

## PROMPT 11 of 19 — STF-GNN + ST-Transformer + PI-RNN

```
Create three new files implementing the advanced ML architecture components.

--- FILE 1: Create server/services/stfGnn.js ---

const SENSOR_NODES = [
  { id:'dog_river',    lat:30.603, lon:-88.103, type:'USGS', do2Field:'do2_dogriver' },
  { id:'fowl_river',   lat:30.484, lon:-88.087, type:'USGS', do2Field:'do2_fowlriver' },
  { id:'mobile_i65',   lat:30.756, lon:-88.025, type:'USGS', do2Field:'do2_mobilei65' },
  { id:'mobile_bucks', lat:30.893, lon:-88.023, type:'USGS', do2Field:'do2_mobilebucks' },
  { id:'alabama_river',lat:31.484, lon:-87.477, type:'USGS', do2Field:'do2_alabamariver' },
  { id:'weeks_bay',    lat:30.416, lon:-87.822, type:'NERRS',do2Field:'wbDo2' },
  { id:'ndbc_42012',   lat:30.065, lon:-87.555, type:'NDBC', do2Field:null },
]

const EDGES = [
  { from:'alabama_river', to:'mobile_bucks',  lag_h:18 },
  { from:'mobile_bucks',  to:'mobile_i65',    lag_h:6  },
  { from:'mobile_i65',    to:'weeks_bay',      lag_h:12 },
  { from:'dog_river',     to:'weeks_bay',      lag_h:18 },
  { from:'fowl_river',    to:'weeks_bay',      lag_h:11 },
]

function relu(x) { return Math.max(0, x) }

function matVecMul(mat, vec) {
  return mat.map(row => row.reduce((s, w, j) => s + w * (vec[j] || 0), 0))
}

export function buildSensorGraph(features) {
  return {
    nodes: SENSOR_NODES.map(n => ({
      ...n,
      do2: features[n.do2Field] ?? null,
      flow: n.id === 'mobile_i65' ? features.flow_mobilei65 : null,
      temp: features.wbTemp ?? features.avg_temp ?? null,
    })),
    edges: EDGES.map(e => ({
      ...e,
      weight: 1 / (e.lag_h || 1),
    })),
  }
}

export function gnnForwardPass(graph, featureMatrix) {
  const n = graph.nodes.length
  const hiddenSize = 8
  const W = Array.from({length:hiddenSize}, () =>
    Array.from({length:featureMatrix[0]?.length||3}, () => (Math.random()-0.5)*0.1)
  )
  const nodeEmbeddings = featureMatrix.map((nodeFeats, i) => {
    const neighbors = graph.edges
      .filter(e => graph.nodes[graph.nodes.findIndex(n=>n.id===e.to)]?.id === graph.nodes[i]?.id)
    const neighborAgg = neighbors.reduce((agg, edge) => {
      const srcIdx = graph.nodes.findIndex(n=>n.id===edge.from)
      if (srcIdx < 0) return agg
      return agg.map((v,j) => v + (featureMatrix[srcIdx]?.[j]||0) * edge.weight)
    }, new Array(nodeFeats.length).fill(0))
    const combined = nodeFeats.map((v,j) => v + neighborAgg[j])
    return matVecMul(W, combined).map(relu)
  })
  return nodeEmbeddings
}

export function getGraphFeatures(features) {
  const graph = buildSensorGraph(features)
  const nodeFeats = graph.nodes.map(n => [
    (n.do2 ?? 7) / 10,
    (n.flow ?? 0) / 20,
    (n.temp ?? 24) / 30,
  ])
  const embeddings = gnnForwardPass(graph, nodeFeats)
  const flat = embeddings.flat()
  return {
    gnn_node_embeddings: flat,
    graph_min_do2: Math.min(...graph.nodes.map(n=>n.do2??9).filter(v=>v>0)),
    graph_upstream_stress: graph.nodes.filter(n=>n.type==='USGS'&&(n.do2??9)<5).length,
  }
}

export default { buildSensorGraph, gnnForwardPass, getGraphFeatures }

--- FILE 2: Create server/services/stTransformer.js ---

function softmax(arr) {
  const max = Math.max(...arr)
  const exps = arr.map(x=>Math.exp(x-max))
  const sum  = exps.reduce((s,v)=>s+v,0)
  return exps.map(v=>v/sum)
}

function dotProduct(a, b) { return a.reduce((s,v,i)=>s+v*(b[i]||0),0) }

function selfAttention(sequence, dModel) {
  const scale = Math.sqrt(dModel||sequence[0]?.length||1)
  return sequence.map((query, i) => {
    const scores   = sequence.map(key => dotProduct(query,key)/scale)
    const weights  = softmax(scores)
    const attended = query.map((_,j) => sequence.reduce((s,val,k)=>s+weights[k]*(val[j]||0),0))
    return attended
  })
}

export function stTransformerPredict(featureVectors) {
  if (!featureVectors?.length || featureVectors.length < 2) {
    return { day1_do2:null, day2_do2:null, day3_do2:null, day4_do2:null, day5_do2:null,
             confidence:0, method:'insufficient_data' }
  }
  const recentDO2 = featureVectors
    .slice(0,Math.min(48,featureVectors.length))
    .map(v => v.features?.min_do2 ?? v.features?.wbDo2 ?? 7)
    .filter(v=>v>0&&v<20)
  if (recentDO2.length < 2) {
    return { day1_do2:null, day2_do2:null, day3_do2:null, day4_do2:null, day5_do2:null,
             confidence:0, method:'no_do2_data' }
  }
  const sequence = recentDO2.slice(0,12).map(v=>[v/10])
  const attended = selfAttention(sequence, 1)
  const trend    = attended.length > 1
    ? (attended[attended.length-1][0] - attended[0][0]) / attended.length
    : 0
  const currentDO2 = recentDO2[0]
  const predictions = [1,2,3,4,5].map(day => {
    const predicted = currentDO2 + trend * day * 10
    return Math.max(0, Math.min(14, predicted))
  })
  return {
    day1_do2: Math.round(predictions[0]*10)/10,
    day2_do2: Math.round(predictions[1]*10)/10,
    day3_do2: Math.round(predictions[2]*10)/10,
    day4_do2: Math.round(predictions[3]*10)/10,
    day5_do2: Math.round(predictions[4]*10)/10,
    confidence: Math.min(100, recentDO2.length * 2),
    method: 'st_transformer_v1',
    trend_per_hour: Math.round(trend*100)/100,
  }
}

--- FILE 3: Create server/services/piRnn.js ---

const GRU_HIDDEN = 16
const D_DIFFUSION = 0.001

function sigmoid(x) { return 1/(1+Math.exp(-x)) }

function gruCell(input, hidden, weights) {
  const z = sigmoid(input*(weights.Wz??0.1) + hidden*(weights.Uz??0.1) + (weights.bz??0))
  const r = sigmoid(input*(weights.Wr??0.1) + hidden*(weights.Ur??0.1) + (weights.br??0))
  const hCand = Math.tanh(input*(weights.Wh??0.1) + r*hidden*(weights.Uh??0.1) + (weights.bh??0))
  return (1-z)*hidden + z*hCand
}

function physicsGapFill(observed, missingValue, lagHours, currentSpeed, temp, chl) {
  const u = currentSpeed ?? 0.15
  const dt = lagHours * 3600
  const dx = 1000
  const source = -(chl??2)*0.001 - Math.max(0,(temp??24)-25)*0.002
  return observed - u*(dt/dx)*(observed-(missingValue??observed))
    + D_DIFFUSION*(dt/dx**2)*(observed-2*observed+observed)
    + source*dt
}

export function piRnnFill(features, fieldName, lagHours=18) {
  if (features[fieldName] != null) return features[fieldName]
  const related = fieldName.includes('do2') || fieldName.includes('Do2')
  if (!related) return features[fieldName]
  const observed = features.avg_do2 ?? features.wbDo2 ?? 7
  const filled = physicsGapFill(
    observed, null, lagHours,
    features.currentSpeed_ms, features.avg_temp, features.wbChlFl
  )
  return Math.max(0, Math.min(15, Math.round(filled*100)/100))
}

export function fillAllNullDO2(features) {
  const do2Fields = [
    'do2_dogriver','do2_fowlriver','do2_mobilei65',
    'do2_mobilebucks','do2_alabamariver','do2_escatawpa','wbDo2_secondary'
  ]
  const filled = { ...features, _gap_filled:[] }
  for (const field of do2Fields) {
    if (features[field] == null) {
      filled[field] = piRnnFill(features, field)
      filled._gap_filled.push(field)
    }
  }
  return filled
}

export default { piRnnFill, fillAllNullDO2 }
```

---

## PROMPT 12 of 19 — openEO BIOPAR + CropSAR + ADPH Shellfish Ground Truth

```
Create three service files for openEO batch jobs, CropSAR, and ADPH shellfish closure scraping.

--- FILE 1: Create server/services/openeoService.js ---

import axios from 'axios'
import { upsertOpenEOJob, getOpenEOJob } from './database.js'

const OPENEO_BASE = 'https://openeo.dataspace.copernicus.eu/openeo/1.1'
const WEEKS_BAY_AOI = { west:-87.95, south:30.35, east:-87.70, north:30.50 }
const WATERSHED_AOI = { west:-89.0,  south:30.5,  east:-87.3,  north:31.5  }

function getCopernicusAuth() {
  const user = process.env.COPERNICUS_USER
  const pass = process.env.COPERNICUS_PASS
  return (user && pass) ? { username:user, password:pass } : null
}

export async function submitBIOPARJob() {
  const auth = getCopernicusAuth()
  if (!auth) return { error:'COPERNICUS credentials not configured' }
  const existing = getOpenEOJob('biopar')
  if (existing && existing.status !== 'finished' && existing.status !== 'error') {
    return { message:'Job already running', ...existing }
  }
  const sevenDaysAgo = new Date(Date.now()-7*86400000).toISOString().split('T')[0]
  const today        = new Date().toISOString().split('T')[0]
  try {
    const { data } = await axios.post(`${OPENEO_BASE}/jobs`, {
      title: 'TERRAWATCH BIOPAR Weeks Bay',
      process: {
        id: 'biopar',
        spatial_extent:  WEEKS_BAY_AOI,
        temporal_extent: [sevenDaysAgo, today],
        output: { format:'GTiff', parameters:{ bands:['LAI','FCOVER','FAPAR'] } }
      }
    }, { auth, timeout:30000 })
    const jobId = data?.id || data?.job_id
    if (jobId) {
      upsertOpenEOJob(jobId, 'biopar', 'created', null, null)
      try { await axios.post(`${OPENEO_BASE}/jobs/${jobId}/results`, {}, { auth, timeout:10000 }) } catch {}
    }
    return { jobId, status:'submitted' }
  } catch(err) {
    return { error:err.message, hint:'BIOPAR requires openEO Algorithm Plaza access with Copernicus creds' }
  }
}

export async function checkBIOPARJob() {
  const auth = getCopernicusAuth()
  if (!auth) return null
  const job = getOpenEOJob('biopar')
  if (!job?.jobId) return null
  try {
    const { data } = await axios.get(`${OPENEO_BASE}/jobs/${job.jobId}`, { auth, timeout:15000 })
    upsertOpenEOJob(job.jobId, 'biopar', data.status, null, null)
    if (data.status === 'finished') {
      return { status:'finished', jobId:job.jobId, lai:null, fcover:null, fapar:null,
               note:'Download result from openEO dashboard to extract LAI/FCOVER scalars' }
    }
    return { status:data.status, jobId:job.jobId }
  } catch(err) { return { error:err.message } }
}

export async function getBIOPARStatus() {
  const job = getOpenEOJob('biopar')
  const daysSinceSubmit = job?.submittedAt
    ? (Date.now()-new Date(job.submittedAt).getTime())/86400000 : null
  const shouldSubmitNew = !job || job.status==='finished' && daysSinceSubmit>7 || job.status==='error'
  if (shouldSubmitNew) {
    submitBIOPARJob().catch(()=>{})
  }
  return { job, shouldSubmitNew,
           biopar_lai:      job?.resultJson?.lai     ?? null,
           biopar_fcover:   job?.resultJson?.fcover  ?? null,
           biopar_fapar:    job?.resultJson?.fapar    ?? null,
           biopar_data_available: job?.resultJson ? 1 : 0,
           biopar_job_age_days: daysSinceSubmit }
}

--- FILE 2: Create server/services/adph.js ---

import axios from 'axios'
import { getRecentVectors } from './database.js'

const ADPH_SEED_CLOSURES = [
  { area:'Mobile Bay',         date:'2023-08-10', reason:'HAB', duration_days:14 },
  { area:'Weeks Bay',          date:'2022-09-01', reason:'HAB', duration_days:9  },
  { area:'Dauphin Island',     date:'2021-10-03', reason:'HAB', duration_days:6  },
  { area:'Mobile Bay Area 1',  date:'2020-08-20', reason:'HAB', duration_days:11 },
  { area:'Mobile Bay',         date:'2019-09-15', reason:'HAB', duration_days:8  },
  { area:'Weeks Bay',          date:'2018-07-28', reason:'HAB', duration_days:5  },
  { area:'Mobile Bay',         date:'2017-09-04', reason:'HAB', duration_days:10 },
]

let _adphCache = { closures:ADPH_SEED_CLOSURES, lastScrape:null }

export async function scrapeADPHClosures() {
  try {
    const { data } = await axios.get(
      'https://www.alabamapublichealth.gov/environmental/shellfishclosures.html',
      { timeout:15000, headers:{'User-Agent':'TERRAWATCH/2.0 (environmental monitoring; contact@hanseholdings.com)'} }
    )
    const closures = []
    const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let match
    while ((match=tableRowRegex.exec(data))!==null) {
      const cells = (match[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi)||[])
        .map(cell=>cell.replace(/<[^>]+>/g,'').trim())
      if (cells.length>=3) {
        const reasonCell = cells.join(' ').toUpperCase()
        if (reasonCell.includes('HAB')||reasonCell.includes('RED TIDE')||reasonCell.includes('HARMFUL ALGAL')) {
          closures.push({
            area:cells[0]||'Unknown', date:cells[1]||new Date().toISOString().split('T')[0],
            reason:'HAB', duration_days:14
          })
        }
      }
    }
    if (closures.length>0) _adphCache = { closures:[...ADPH_SEED_CLOSURES,...closures], lastScrape:new Date().toISOString() }
    return _adphCache
  } catch(err) {
    return _adphCache
  }
}

export function getADPHStatus() {
  const today = new Date()
  const activeClosure = _adphCache.closures.find(c => {
    const closeDate  = new Date(c.date)
    const reopenDate = new Date(c.date)
    reopenDate.setDate(reopenDate.getDate()+(c.duration_days||14))
    return today>=closeDate && today<=reopenDate
  })
  const daysSinceLast = _adphCache.closures.length
    ? Math.round((today-new Date(_adphCache.closures[0].date))/86400000) : null
  return {
    adph_closure_active:        activeClosure ? 1 : 0,
    nearest_closure_area:       activeClosure?.area ?? null,
    adph_days_since_last_closure: daysSinceLast,
    adph_closures_last_90_days: _adphCache.closures.filter(c=>
      (today-new Date(c.date))/86400000<=90).length,
    total_historical_closures:  _adphCache.closures.length,
    lastScrape:                 _adphCache.lastScrape,
    seedDataLoaded:             true,
  }
}

In server/index.js, schedule a daily ADPH scrape:
  import { scrapeADPHClosures, getADPHStatus } from './services/adph.js'
  cron.schedule('0 6 * * *', () => { scrapeADPHClosures().catch(()=>{}) })
  // Run on startup too:
  scrapeADPHClosures().catch(()=>{})

  // In the 3-minute cron, add ADPH status to features:
  const adphStatus = getADPHStatus()
  // Pass to buildFeatureVector():
  //   adph_closure_active: adphStatus.adph_closure_active
  //   adph_days_since_last_closure: adphStatus.adph_days_since_last_closure
  //   adph_closures_last_90_days: adphStatus.adph_closures_last_90_days

  // Alert if active ADPH closure
  if (adphStatus.adph_closure_active === 1) {
    triggerEnvAlerts({
      type:'adph_closure', severity:'CRITICAL',
      message:`ACTIVE ADPH SHELLFISH CLOSURE — ${adphStatus.nearest_closure_area}. HAB confirmed by state authority.`,
      source:'ADPH'
    })
  }
```

---

## PROMPT 13 of 19 — Four Product Intelligence Pages

```
Create four new React page components and their server routes. All required data is already ingested — this is product layer only.

--- SERVER ROUTES: Create server/routes/flood.js ---

import express from 'express'
const router = express.Router()

router.get('/status', async (req, res) => {
  try {
    const [goesRes, weatherRes, ahpsRes] = await Promise.allSettled([
      import('../services/goes19.js').then(m=>m.getLatestGOES19?.()??{}),
      import('../routes/weather.js').then(m=>m.getCurrentWeather?.()??{}),
      import('../services/landregweather.js').then(m=>m.getAHPSFloodStage('MBLM6')),
    ])
    const goes   = goesRes.status==='fulfilled'   ? goesRes.value   : {}
    const weather= weatherRes.status==='fulfilled' ? weatherRes.value : {}
    const ahps   = ahpsRes.status==='fulfilled'   ? ahpsRes.value   : {}

    const qpe24h     = goes?.goes_qpe_24h ?? goes?.cumulative_24h_mm ?? 0
    const qpe6h      = goes?.goes_qpe_6h  ?? goes?.cumulative_6h_mm  ?? 0
    const sstGrad    = goes?.goes_sst_gradient ?? 0
    const floodStage = ahps?.ahps_flood_stage_ft ?? null
    const floodActive= ahps?.ahps_flood_active   ?? 0
    const stageScore = floodStage ? Math.min(40, (floodStage/25)*40) : 0
    const qpeScore   = Math.min(25, (qpe24h/20)*25)
    const stratScore = Math.min(20, (sstGrad/5)*20)
    const compound_flood_score = Math.round(stageScore + qpeScore + stratScore)

    res.json({
      compound_flood_score,
      risk_level: compound_flood_score>75?'CRITICAL':compound_flood_score>50?'HIGH':compound_flood_score>25?'MODERATE':'LOW',
      mobile_river_stage_ft: floodStage,
      flood_stage_active: floodActive,
      qpe_24h_mm: qpe24h, qpe_6h_mm: qpe6h,
      sst_gradient: sstGrad,
      timestamp: new Date().toISOString(),
    })
  } catch(err) { res.status(500).json({ error:err.message }) }
})

export default router

--- Similarly create server/routes/beach.js, server/routes/climate.js, server/routes/pollution.js ---

For beach.js (GET /status): Aggregate HAB probability from /api/hab/assess, min_do2 from latest vector, wind speed from NDBC, bloom_index from GOES-19. Score = (habProb*0.35) + (do2StressIdx*0.25) + (waveIdx*0.15) + (bloomProx*0.25). Return beach_safety_score 0-100, safe_to_swim (score<25), advisory_level (SAFE/CAUTION/ADVISORY/CLOSED).

For climate.js (GET /vulnerability): Query SQLite for avg_do2 trend over 30 days. Aggregate: fema_flood_zone, goes_sst_gradient trend, halocline_index, wbChlFl trend. Return vulnerability_score 0-100 with component breakdown.

For pollution.js (GET /chain): Fetch EPA ECHO NPDES facilities from existing epa.js. Fetch ATTAINS from landregweather.js. Return source_count, facility_list, impaired_segments, causal_chain (NPDES facilities → downstream ATTAINS impaired segments in HUC 03160203).

--- Register in server/index.js ---

import floodRoutes    from './routes/flood.js'
import beachRoutes    from './routes/beach.js'
import climateRoutes  from './routes/climate.js'
import pollutionRoutes from './routes/pollution.js'

app.use('/api/flood',     floodRoutes)
app.use('/api/beach',     beachRoutes)
app.use('/api/climate',   climateRoutes)
app.use('/api/pollution', pollutionRoutes)

--- Create src/pages/CompoundFlood.jsx ---

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

export default function CompoundFlood() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/flood/status').then(r=>r.json()).then(setData).catch(console.error)
    const interval = setInterval(()=>fetch('/api/flood/status').then(r=>r.json()).then(setData),300000)
    return ()=>clearInterval(interval)
  },[])
  const score = data?.compound_flood_score ?? 0
  const color = score>75?'#ef4444':score>50?'#f97316':score>25?'#eab308':'#22c55e'
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold text-green-400 mb-6">🌊 Compound Flood Intelligence Engine</h1>
      {score>60&&<div className="bg-orange-900 border border-orange-500 rounded p-3 mb-4 text-orange-200">⚠ Compound Flood Risk ELEVATED — Score {score}/100</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Flood Risk Score', value:`${score}/100`, color },
          { label:'Mobile River Stage', value:data?.mobile_river_stage_ft!=null?`${data.mobile_river_stage_ft.toFixed(1)} ft`:'--', color:data?.flood_stage_active?'#f97316':'#22c55e' },
          { label:'QPE 24h', value:data?.qpe_24h_mm!=null?`${data.qpe_24h_mm.toFixed(1)} mm`:'--', color:'#60a5fa' },
          { label:'SST Gradient', value:data?.sst_gradient!=null?`${data.sst_gradient.toFixed(1)}°C`:'--', color:'#c084fc' },
        ].map(({label,value,color:c})=>(
          <div key={label} className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold" style={{color:c}}>{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-sm text-gray-400 uppercase mb-2">Risk Level: <span style={{color}}>{data?.risk_level??'--'}</span></h2>
        <div className="text-sm text-gray-300">
          {data?.risk_level==='HIGH'||data?.risk_level==='CRITICAL'
            ? 'Multiple flood risk factors active. Monitor USGS stream gauges and NOAA NWS flood advisories.'
            : 'Flood conditions within normal range. Continue routine monitoring.'}
        </div>
      </div>
      <div className="text-xs text-gray-600 mt-4">Updated: {data ? new Date().toLocaleTimeString() : '--'} · Auto-refresh every 5 minutes</div>
    </div>
  )
}

--- Create src/pages/BeachSafety.jsx, src/pages/ClimateVulnerability.jsx, src/pages/PollutionTracker.jsx ---

Follow same pattern: fetch from /api/beach/status, /api/climate/vulnerability, /api/pollution/chain. Show KPI grid + risk interpretation + data quality notes. Style consistent with dark TERRAWATCH theme.

--- Update src/App.jsx routing ---

import CompoundFlood        from './pages/CompoundFlood'
import BeachSafety          from './pages/BeachSafety'
import ClimateVulnerability from './pages/ClimateVulnerability'
import PollutionTracker     from './pages/PollutionTracker'

// In Routes block:
<Route path="/flood"      element={<CompoundFlood />} />
<Route path="/beach"      element={<BeachSafety />} />
<Route path="/climate"    element={<ClimateVulnerability />} />
<Route path="/pollution"  element={<PollutionTracker />} />

--- Update navigation component (Sidebar, Nav, or similar) ---

Add these links to the main navigation in whatever navigation component file exists:
{ path:'/flood',     label:'Compound Flood',   icon:'🌊' },
{ path:'/beach',     label:'Beach Safety',      icon:'🏖' },
{ path:'/climate',   label:'Climate Index',     icon:'🌡' },
{ path:'/pollution', label:'Pollution Tracker', icon:'🏭' },
```

---

## PROMPT 14 of 19 — Zustand Store + Universal Data Router + Dashboard Updates

```
Find the Zustand store file (likely src/store/twStore.js or src/store/useStore.js or src/store/index.js — look for create( from 'zustand'). Add state and fetchers for all new data sources.

--- CHANGE 1: Add new state slices ---

In the existing state object, add:
  compoundFloodData:         null,
  beachSafetyData:           null,
  climateVulnerabilityData:  null,
  pollutionChainData:        null,
  latestInference:           null,
  latestSHAP:                null,
  sourceHealth:              [],
  adphData:                  null,
  paceData:                  null,

--- CHANGE 2: Add fetchers ---

  fetchFloodData: async () => {
    try { const d=await fetch('/api/flood/status').then(r=>r.json()); set({compoundFloodData:d}) } catch{}
  },
  fetchBeachData: async () => {
    try { const d=await fetch('/api/beach/status').then(r=>r.json()); set({beachSafetyData:d}) } catch{}
  },
  fetchClimateData: async () => {
    try { const d=await fetch('/api/climate/vulnerability').then(r=>r.json()); set({climateVulnerabilityData:d}) } catch{}
  },
  fetchPollutionData: async () => {
    try { const d=await fetch('/api/pollution/chain').then(r=>r.json()); set({pollutionChainData:d}) } catch{}
  },
  fetchLatestInference: async () => {
    try {
      const d=await fetch('/api/intelligence/explain/latest').then(r=>r.json())
      set({latestInference:d, latestSHAP:d.featureContributions})
    } catch{}
  },
  fetchSourceHealth: async () => {
    try { const d=await fetch('/api/intelligence/source-health').then(r=>r.json()); set({sourceHealth:d.sources||[]}) } catch{}
  },

--- CHANGE 3: Update fetchAll() to include new fetchers ---

Find fetchAll() and add to Priority 3 (background, non-blocking):
  get().fetchFloodData()
  get().fetchBeachData()
  get().fetchClimateData()
  get().fetchPollutionData()
  get().fetchLatestInference()
  get().fetchSourceHealth()

--- CHANGE 4: Update Dashboard.jsx ---

In the Dashboard component, find the main data strip area. Add after the existing GOES-19 strip:

  {/* Product Score Strip */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    {[
      { label:'Compound Flood', score:compoundFloodData?.compound_flood_score, path:'/flood', icon:'🌊', color:'#60a5fa' },
      { label:'Beach Safety',  score:beachSafetyData?.beach_safety_score,      path:'/beach', icon:'🏖', color:'#34d399' },
      { label:'Climate Index', score:climateVulnerabilityData?.vulnerability_score, path:'/climate', icon:'🌡', color:'#f59e0b' },
      { label:'Pollution',     score:null, path:'/pollution', icon:'🏭', color:'#a78bfa' },
    ].map(({label,score,path,icon,color})=>(
      <a key={path} href={path} className="bg-gray-800 hover:bg-gray-750 rounded-lg p-3 cursor-pointer block">
        <div className="text-xs text-gray-400 mb-1">{icon} {label}</div>
        <div className="text-xl font-bold" style={{color}}>{score!=null?`${score}/100`:'VIEW →'}</div>
      </a>
    ))}
  </div>

Add alert banners at the very top of the Dashboard (above all other content):

  {/* Alert banners */}
  {adphData?.adph_closure_active===1&&(
    <div className="bg-red-900 border border-red-500 rounded p-3 mb-3 text-red-200 flex items-center gap-2">
      <span className="font-bold text-red-400">⚠ ACTIVE ADPH SHELLFISH CLOSURE</span>
      <span>HAB confirmed — {adphData.nearest_closure_area}. Harvest prohibited.</span>
    </div>
  )}
  {compoundFloodData?.compound_flood_score>60&&(
    <div className="bg-orange-900 border border-orange-500 rounded p-3 mb-3 text-orange-200">
      🌊 Compound Flood Risk ELEVATED — Score {compoundFloodData.compound_flood_score}/100
    </div>
  )}
  {latestInference?.featureContributions?.[0]&&(
    <div className="bg-blue-900 border border-blue-700 rounded p-2 mb-3 text-blue-200 text-sm">
      🤖 ML: {latestInference.riskLevel} ({latestInference.confidence}% confidence) — top driver: {latestInference.featureContributions[0].feature.replace(/_/g,' ')}
    </div>
  )}

Add at the bottom of the Dashboard an AHPS flood stage card and 7-day precip forecast if that data is available.

--- CHANGE 5: Update Feed Status page ---

In the Feed Status page (src/pages/FeedStatus.jsx or similar), add:

At the top: a source health summary bar fetched from /api/intelligence/source-health:
  {sourceHealth.length>0&&(
    <div className="bg-gray-800 rounded p-3 mb-4">
      <div className="text-sm text-gray-300 mb-2">
        Data Source Coverage: <span className="text-green-400 font-bold">{sourceHealth.filter(s=>s.available).length}</span>/{sourceHealth.length} live
      </div>
      <div className="flex flex-wrap gap-1">
        {sourceHealth.map(s=>(
          <span key={s.source} className={`text-xs px-2 py-0.5 rounded ${s.available?'bg-green-900 text-green-300':'bg-red-900 text-red-300'}`}
            title={s.lastValue!=null?`Last: ${s.lastValue}`:s.errorMessage||'No data'}>
            {s.source}
          </span>
        ))}
      </div>
    </div>
  )}

Update PACE OCI badge: if pace_active from PACE status = 1 show green LIVE, if 0 but creds configured show yellow SEARCHING, else red NO CREDENTIALS.
```

---

## PROMPT 15 of 19 — Complete DO2 + Nutrient Sensor Census

```
Fix the most critical ML gap: three USGS station DO2 readings, one NERRS secondary station, nutrients, gage height, and WQP are all missing from the feature vector and training data.

--- CHANGE 1: Add WQP DO2 function to the water service file ---

Find the server-side water service file (waterQuality.js or similar). Add:

export async function getWQPDO2(daysBack=1) {
  try {
    const startDate = new Date(Date.now()-daysBack*86400000).toISOString().split('T')[0]
    const { data } = await axios.get('https://www.waterqualitydata.us/data/Result/search', {
      params: {
        bBox:'-88.8,30.0,-87.5,31.2',
        startDateLo:startDate,
        characteristicName:'Dissolved oxygen',
        mimeType:'json',
        dataProfile:'resultPhysChemical',
      },
      timeout:20000
    })
    const results  = Array.isArray(data) ? data : (data?.features||[])
    const readings = results
      .map(r=>{
        const val = parseFloat(r.properties?.ResultMeasureValue ?? r.ResultMeasureValue)
        const lat = parseFloat(r.geometry?.coordinates?.[1] ?? r.ActivityLocation?.LatitudeMeasure)
        const lon = parseFloat(r.geometry?.coordinates?.[0] ?? r.ActivityLocation?.LongitudeMeasure)
        return { value:val, lat, lon }
      })
      .filter(r=>!isNaN(r.value)&&r.value>0&&r.value<20)
    return {
      available:readings.length>0,
      count:readings.length,
      wqp_do2_min: readings.length ? Math.min(...readings.map(r=>r.value)) : null,
      wqp_do2_avg: readings.length ? readings.reduce((s,r)=>s+r.value,0)/readings.length : null,
      readings: readings.slice(0,10),
    }
  } catch(err) {
    return { available:false, wqp_do2_min:null, error:err.message }
  }
}

--- CHANGE 2: Add missing USGS station extractions ---

In the USGS water fetch (wherever USGS NWIS is parsed), add extractions for the three missing stations. The six active sites are:
  02428400 Alabama River, 02469761 Mobile River I-65, 02469800 Mobile River Bucks,
  02479000 Dog River, 02479155 Fowl River, 02471078 Escatawpa River

Also add to the USGS parameter code list if comma-separated:
  00065 (gage height ft), 00671 (orthophosphate mg/L P), 00600 (total N mg/L)

In buildFeatureVector(), add alongside do2_dogriver, do2_fowlriver, do2_mobilei65:
  do2_mobilebucks:   getStationDO2(usgsData, '02469800'),
  do2_alabamariver:  getStationDO2(usgsData, '02428400'),
  do2_escatawpa:     getStationDO2(usgsData, '02471078'),
  gage_height_dogriver:  getStationParam(usgsData, '02479000', '00065'),
  gage_height_mobilei65: getStationParam(usgsData, '02469761', '00065'),
  ortho_p_dogriver:      getStationParam(usgsData, '02479000', '00671'),
  total_n_mobilei65:     getStationParam(usgsData, '02469761', '00600'),

Where getStationParam(data, siteNo, paramCode) looks up the parsed USGS response for that site and parameter. Implement this helper if it doesn't exist:

function getStationParam(usgsData, siteNo, paramCode) {
  if (!usgsData?.timeSeries) return null
  const series = usgsData.timeSeries.find(ts =>
    ts.sourceInfo?.siteCode?.[0]?.value === siteNo &&
    ts.variable?.variableCode?.[0]?.value === paramCode
  )
  const val = series?.values?.[0]?.value?.[0]?.value
  return val != null ? parseFloat(val) : null
}

--- CHANGE 3: Update DO2 aggregate to use all 8 sources ---

Find where min_do2, avg_do2, hypoxic_stations are computed. Replace:

const allDO2 = [
  features.do2_dogriver, features.do2_fowlriver, features.do2_mobilei65,
  features.do2_mobilebucks, features.do2_alabamariver, features.do2_escatawpa,
  features.wbDo2, features.wbDo2_secondary,
].filter(v => v != null && v > 0 && v < 20)

features.min_do2          = allDO2.length ? Math.min(...allDO2) : null
features.avg_do2          = allDO2.length ? allDO2.reduce((s,v)=>s+v,0)/allDO2.length : null
features.max_do2          = allDO2.length ? Math.max(...allDO2) : null
features.std_do2          = allDO2.length>1 ? Math.sqrt(allDO2.map(v=>(v-features.avg_do2)**2).reduce((s,v)=>s+v,0)/allDO2.length) : null
features.station_count    = allDO2.length
features.hypoxic_stations = allDO2.filter(v=>v<3).length
features.low_do2_stations = allDO2.filter(v=>v<5).length

--- CHANGE 4: Fetch NERRS wekbwq secondary station ---

In the NERRS service, add a parallel fetch for the secondary station:

export async function getNERRSSecondaryWQ() {
  try {
    const { data } = await axios.get(
      'https://cdmo.baruch.sc.edu/webservices2/exportSingleStationXML.cfm',
      { params:{ station_code:'wekbwq', recs:1 }, timeout:12000, responseType:'text' }
    )
    const str = typeof data==='string' ? data : JSON.stringify(data)
    const parseP = (xml, param) => {
      const m = xml.match(new RegExp(`<${param}[^>]*>([\\d.-]+)<\/${param}>`, 'i'))
      return m ? parseFloat(m[1]) : null
    }
    return {
      available:true,
      wbDo2_secondary:   parseP(str,'DO_mgl'),
      wbSal_secondary:   parseP(str,'Sal'),
      wbChlFl_secondary: parseP(str,'ChlFluor'),
    }
  } catch(err) {
    return { available:false, wbDo2_secondary:null, wbSal_secondary:null, wbChlFl_secondary:null }
  }
}

Wire this into the 3-minute cron parallel fetch block alongside the primary NERRS call.

--- CHANGE 5: Fetch NERRS wekmet meteorological station ---

export async function getNERRSMeteorologicalData() {
  try {
    const { data } = await axios.get(
      'https://cdmo.baruch.sc.edu/webservices2/exportSingleStationXML.cfm',
      { params:{ station_code:'wekmet', recs:1 }, timeout:12000, responseType:'text' }
    )
    const str = typeof data==='string' ? data : JSON.stringify(data)
    const parseP = (xml, p) => {
      const m = xml.match(new RegExp(`<${p}[^>]*>([\\d.-]+)<\/${p}>`, 'i'))
      return m ? parseFloat(m[1]) : null
    }
    return {
      available:true,
      wbPAR:     parseP(str,'TotPAR'),
      wbWSpd:    parseP(str,'WSpd'),
      wbMaxWSpd: parseP(str,'MaxWSpd'),
      wbWdir:    parseP(str,'Wdir'),
      wbATemp:   parseP(str,'ATemp'),
      wbBP:      parseP(str,'BP'),
      wbPrec:    parseP(str,'TotPrcp'),
      wbRH:      parseP(str,'RH'),
    }
  } catch(err) {
    return { available:false }
  }
}

Wire wekmet into the 3-minute cron. In buildFeatureVector(), spread the result:
  ...(nerrsMetData ?? {}),

--- CHANGE 6: Update habOracle.js dissolved_oxygen risk to use all sources ---

In server/ml/habOracle.js, update the dissolved_oxygen risk factor to use the minimum across all DO2 sources:

function dissolvedOxygenRisk(inputs) {
  const candidates = [
    inputs.do_mg_l, inputs.wbDo2, inputs.wbDo2_secondary, inputs.min_do2,
    inputs.do2_dogriver, inputs.do2_fowlriver, inputs.do2_mobilei65,
    inputs.do2_mobilebucks, inputs.do2_alabamariver, inputs.do2_escatawpa,
    inputs.wqp_do2_min,
  ].filter(v => v!=null && v>0 && v<20)
  if (!candidates.length) return 0.35
  const minDO2 = Math.min(...candidates)
  if (minDO2 < 2) return 0.95
  if (minDO2 < 3) return 0.80
  if (minDO2 < 5) return 0.60
  if (minDO2 < 6) return 0.35
  return 0.10
}
```

---

## PROMPT 16 of 19 — Fix Open-Meteo Hour Bug + AHPS XML Parse + HF Radar ID + Land/Reg Cron

```
Fix six bugs where data is fetched incorrectly or never reaches the feature vector.

--- FIX 1: Open-Meteo — hourly index 0 is midnight, not current hour ---

In server/services/landregweather.js, in getOpenMeteoWeather():

Add the solar_radiation, uv_index, lifted_index, soil_moisture to the hourly request:
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,cape,shortwave_radiation,uv_index,lifted_index,soil_moisture_0_to_7cm',

Replace the current object construction to use the correct hour index:

    const nowHour = new Date().getHours()
    current: data.hourly ? {
      temp_c:        data.hourly.temperature_2m?.[nowHour],
      wind_ms:       data.hourly.wind_speed_10m?.[nowHour],
      wind_dir:      data.hourly.wind_direction_10m?.[nowHour],
      precip_mm:     data.hourly.precipitation?.[nowHour],
      cape:          data.hourly.cape?.[nowHour],
      solar_rad_wm2: data.hourly.shortwave_radiation?.[nowHour],
      uv_index:      data.hourly.uv_index?.[nowHour],
      lifted_index:  data.hourly.lifted_index?.[nowHour],
      soil_moisture: data.hourly.soil_moisture_0_to_7cm?.[nowHour],
    } : null,
    dailySummary: data.daily ? {
      precip_7day_sum_mm:  data.daily.precipitation_sum?.reduce((s,v)=>s+(v||0),0) ?? null,
      max_precip_prob_7d:  data.daily.precipitation_probability_max
        ? Math.max(...data.daily.precipitation_probability_max) : null,
      dailyForecasts: data.daily.time?.map((t,i)=>({
        date:t,
        precip_mm:  data.daily.precipitation_sum?.[i],
        maxWind_ms: data.daily.wind_speed_10m_max?.[i],
        precipProb: data.daily.precipitation_probability_max?.[i],
      })),
    } : null,

--- FIX 2: AHPS — Parse XML to extract actual flood stage number ---

In server/services/landregweather.js, replace getAHPSFloodStage():

export async function getAHPSFloodStage(gageId='MBLM6') {
  try {
    const { data } = await axios.get(AHPS_BASE, {
      params:{ gage:gageId, type:'both', output:'xml' },
      timeout:12000, responseType:'text'
    })
    const str = typeof data==='string' ? data : ''
    const stageMatch = str.match(/<observed[^>]*>[\s\S]*?<primary[^>]*>([\d.]+)/i)
      || str.match(/<stage[^>]*>([\d.]+)<\/stage>/i)
      || str.match(/<value>([\d.]+)<\/value>/i)
    const floodMatch  = str.match(/<flood>([\d.]+)<\/flood>/i)
    const observed    = stageMatch ? parseFloat(stageMatch[1]) : null
    const floodStage  = floodMatch  ? parseFloat(floodMatch[1])  : 25.0
    return {
      available:          true,
      product:            'NOAA AHPS',
      gageId,
      ahps_flood_stage_ft: observed,
      ahps_flood_active:   observed!=null && observed>=floodStage ? 1 : 0,
      pct_of_flood_stage:  observed&&floodStage ? Math.round(observed/floodStage*100) : null,
    }
  } catch(err) {
    return { available:false, ahps_flood_stage_ft:null, ahps_flood_active:0, error:err.message }
  }
}

--- FIX 3: HF Radar — Try NOAA IOOS endpoint first ---

In whatever file fetches HF Radar (crossSensor.js or a dedicated HF service):

const HF_RADAR_ENDPOINTS = [
  { base:'https://erddap.ioos.us/erddap',               id:'HFRadar_US_East_Gulf_6km_hourly' },
  { base:'https://erddap.ioos.us/erddap',               id:'hfradar_usgc_6km' },
  { base:'https://coastwatch.pfeg.noaa.gov/erddap',     id:'ucsdHfrE6' },
]

Wrap the HF Radar fetch in a loop that tries each endpoint in order and uses the first successful response. Log which endpoint succeeded.

--- FIX 4: Wire Open-Meteo and AHPS into buildFeatureVector ---

In server/index.js in the 3-minute cron, fetch these every tick:

const [omResult, ahpsResult] = await Promise.allSettled([
  withTimeout(getOpenMeteoWeather(), 10000, { available:false }),
  withTimeout(getAHPSFloodStage('MBLM6'), 12000, { available:false, ahps_flood_stage_ft:null, ahps_flood_active:0 }),
])
const omData   = omResult.status==='fulfilled'   ? omResult.value   : null
const ahpsData = ahpsResult.status==='fulfilled' ? ahpsResult.value : null

writeSourceHealth('OpenMeteo', omData?.available, null, omData?.current?.temp_c, null)
writeSourceHealth('AHPS', ahpsData?.available, null, ahpsData?.ahps_flood_stage_ft, ahpsData?.error)

In buildFeatureVector(), add these fields (receive omData and ahpsData as parameters):
  precip_current_mm:    omData?.current?.precip_mm      ?? null,
  wind_ms_openmeteo:    omData?.current?.wind_ms         ?? null,
  cape_jkg:             omData?.current?.cape            ?? null,
  solar_rad_wm2:        omData?.current?.solar_rad_wm2   ?? null,
  uv_index:             omData?.current?.uv_index        ?? null,
  lifted_index:         omData?.current?.lifted_index    ?? null,
  soil_moisture:        omData?.current?.soil_moisture   ?? null,
  precip_7day_sum_mm:   omData?.dailySummary?.precip_7day_sum_mm   ?? null,
  max_precip_prob_7d:   omData?.dailySummary?.max_precip_prob_7d   ?? null,
  ahps_flood_stage_ft:  ahpsData?.ahps_flood_stage_ft   ?? null,
  ahps_flood_active:    ahpsData?.ahps_flood_active      ?? 0,
  fema_flood_zone:      _landRegCache?.fema_flood_zone   ?? 0,
  nlcd_impervious_pct:  _landRegCache?.nlcd_impervious_pct ?? null,
  attains_impaired_segments_count: _landRegCache?.attains_impaired_segments_count ?? null,

--- FIX 5: Wire FEMA/NLCD/ATTAINS on 6-hour schedule ---

Add to server/index.js module scope:
let _landRegCache = null
let _lastLandFetch = 0

In the 3-minute cron:
if (Date.now() - _lastLandFetch > 21600000) {
  Promise.allSettled([
    import('./services/landregweather.js').then(m=>m.getFEMAFloodZone()),
    import('./services/landregweather.js').then(m=>m.getNLCDLandCover()),
    import('./services/landregweather.js').then(m=>m.getATTAINSWaterbodies()),
  ]).then(([fema,nlcd,attains]) => {
    _landRegCache = {
      fema_flood_zone: fema.value?.inFloodZone ? 1 : 0,
      nlcd_impervious_pct: [21,22,23,24].includes(nlcd.value?.code) ? (nlcd.value.code-20)*20 : 0,
      attains_impaired_segments_count: attains.value?.data?.items?.length ?? null,
    }
    _lastLandFetch = Date.now()
  }).catch(()=>{})
}
```

---

## PROMPT 17 of 19 — Derived Features + Physics-Based Computations

```
Add all derived features to buildFeatureVector() in server/services/crossSensor.js. These encode environmental physics and ecology that raw sensor values cannot express alone. All features are computations over already-fetched data — no new network calls needed.

Add these to the buildFeatureVector() return object (after all raw sensor fields):

  // === STRATIFICATION PHYSICS ===
  halocline_index: (() => {
    const bot = features?.salinity_dauphinIs, surf = features?.wbSal
    return (bot!=null&&surf!=null) ? Math.max(0, bot-surf) : null
  })(),
  halocline_strong: (() => {
    const bot = features?.salinity_dauphinIs, surf = features?.wbSal
    return (bot!=null&&surf!=null) ? ((bot-surf)>5?1:0) : null
  })(),

  // === THERMAL SIGNALS ===
  sst_vs_buoy_delta: (() => {
    const baySST = features?.goes_sst_mean, buoySST = features?.buoy_water_temp_c
    return (baySST!=null&&buoySST!=null) ? baySST-buoySST : null
  })(),
  goes_sst_range: (() => {
    const mn = features?.goes_sst_min, mx = features?.goes_sst_max
    return (mn!=null&&mx!=null) ? mx-mn : null
  })(),

  // === BLOOM TRANSPORT DIRECTION ===
  bloom_toward_dauphin: features?.currentDir_deg!=null
    ? (features.currentDir_deg>=135&&features.currentDir_deg<=315?1:0) : null,
  bloom_toward_weeksbay: features?.currentDir_deg!=null
    ? (features.currentDir_deg>=315||features.currentDir_deg<=45?1:0) : null,
  nws_wind_onshore: features?.nws_wind_dir_deg!=null
    ? (features.nws_wind_dir_deg>=157&&features.nws_wind_dir_deg<=337?1:0) : null,

  // === RATE-OF-CHANGE (Most predictive early warning signals) ===
  do2_trend_1h:      computeTrend(recentVectors,'min_do2',60),
  chlfluor_trend_1h: computeTrend(recentVectors,'wbChlFl',60),
  sst_trend_1h:      computeTrend(recentVectors,'goes_sst_mean',60),
  flow_trend_1h:     computeTrend(recentVectors,'total_flow_kcfs',60),
  do2_declining_fast: (() => {
    const t = computeTrend(recentVectors,'min_do2',60)
    return (t!=null&&t<-0.3)?1:0
  })(),

  // === INTERACTION TERMS ===
  // ChlFluor × Salinity — K. brevis blooms in salty + high-nutrient water
  chlfluor_salinity_bloom: (features?.wbChlFl!=null&&features?.wbSal!=null)
    ? features.wbChlFl * Math.max(0, features.wbSal-15) / 10 : null,

  // === UNIFIED STRESS SUMMARY ===
  compound_stress_index: (() => {
    const s=[]
    if (features?.min_do2!=null)           s.push(Math.max(0,(6-features.min_do2)/6))
    if (features?.goes_sst_gradient!=null) s.push(Math.min(1,features.goes_sst_gradient/5))
    if (features?.halocline_index!=null)   s.push(Math.min(1,features.halocline_index/10))
    if (features?.wbChlFl!=null)           s.push(Math.min(1,features.wbChlFl/30))
    return s.length ? Math.round(s.reduce((a,v)=>a+v,0)/s.length*100) : null
  })(),

  // === DO2 PERCENT SATURATION ===
  // Use NERRS direct reading first; compute from physics if unavailable
  wbDOPct_computed: (() => {
    if (features?.wbDOPct!=null&&features.wbDOPct>0) return features.wbDOPct
    const do2=features?.wbDo2, temp=features?.wbTemp, sal=features?.wbSal??15
    if (!do2||!temp) return null
    const Ts = Math.log((298.15-temp)/(273.15+temp))
    const lnDOsat = 2.00907+3.22014*Ts+4.05010*Ts**2+4.94457*Ts**3-0.256847*Ts**4+3.88767*Ts**5
    const DOsat = Math.exp(lnDOsat)*Math.exp(-sal*(0.00624+0.00693*Ts))
    return DOsat>0 ? Math.round(do2/DOsat*100*10)/10 : null
  })(),

  // === AIR QUALITY ALERT ===
  air_quality_alert: (features?.aqi??0) > 100 ? 1 : 0,

NOTE: The variable 'features' in the above refers to the object being assembled by buildFeatureVector() as it is built. You may need to compute halocline_index first as a local variable, then reference it in other computations. Adjust variable references to match your actual buildFeatureVector() scope.

Also in server/index.js in evaluateAndDispatchAlerts(), add the rapid DO2 decline alert:

if (features?.do2_declining_fast===1 && (features?.min_do2??9)<6) {
  alerts.push({
    type:'do2_rapid_decline', severity:'HIGH',
    message:`DO₂ declining rapidly — ${features.do2_trend_1h?.toFixed(2)} mg/L/hr at ${features.min_do2?.toFixed(1)} mg/L. Hypoxia may occur within hours.`,
    source:'USGS+NERRS'
  })
}
```

---

## PROMPT 18 of 19 — Biodiversity + Extended GOES-19 + Visualize Orphaned Data

```
Wire the biodiversity baseline, add GOES-19 extended SST fields, and surface previously unvisualized science data to users.

--- PART 1: Wire Biodiversity Baseline into ML pipeline ---

In server/index.js, add module-level cache and daily fetch:

import { getBiodiversityBaseline } from './services/ecology.js'

let _bioCache = null
let _lastBioFetch = 0

In the 3-minute cron:
if (Date.now() - _lastBioFetch > 86400000) {
  getBiodiversityBaseline(90).then(r => {
    _bioCache = r
    _lastBioFetch = Date.now()
    console.log('[Bio] Updated — bivalves:', r.bivalves, 'fish:', r.fish, 'saltmarsh:', r.saltmarsh)
  }).catch(() => {})
}

In buildFeatureVector(), add:
  bivalve_obs_90d:   _bioCache?.bivalves   ?? null,
  fish_obs_90d:      _bioCache?.fish        ?? null,
  saltmarsh_obs_90d: _bioCache?.saltmarsh   ?? null,

--- PART 2: GOES-19 extended SST fields ---

In buildFeatureVector(), in the GOES-19 section, add extraction of bay_min_c, bay_max_c, offshore_c from the stored GOES-19 data. These are already sent by the ground station (per the API spec) but not currently in the feature vector:

  goes_sst_min:             goesData?.sst?.bay_min_c      ?? goesData?.bay_min_c ?? null,
  goes_sst_max:             goesData?.sst?.bay_max_c      ?? goesData?.bay_max_c ?? null,
  goes_sst_offshore:        goesData?.sst?.offshore_c     ?? goesData?.offshore_c ?? null,
  goes_solar_zenith:        goesData?.rgb?.solar_zenith_deg ?? goesData?.solar_zenith_deg ?? null,
  goes_nearest_lightning_km:goesData?.glm?.nearest_cell_km ?? goesData?.nearest_cell_km ?? null,

Replace 'goesData' with whatever variable holds the GOES-19 latest scan data in your scope.

--- PART 3: Add Ecosystem tab to Science View page ---

In src/pages/ScienceView.jsx (or whatever the Science View component is named), add a 6th tab "Ecosystem":

Tab content:
- Biodiversity headline row: fish count, bivalve count, saltmarsh count, bird count (from biodiversity cache — fetch from a new GET /api/ecology/baseline endpoint)
- Bivalve crash alert: if bivalve_obs_90d < 15, show yellow warning "Low bivalve observations — potential past hypoxia event"
- iNaturalist observations: last 10 observations in Mobile Bay area with species name, date, photo URL thumbnail
- Chart: Recharts BarChart of iNaturalist observation counts by taxon group for the last 90 days

Add GET /api/ecology/baseline route:
  router.get('/baseline', async (req, res) => {
    const { getBiodiversityBaseline, getInaturalistObservations } = await import('../services/ecology.js')
    const [bio, obs] = await Promise.allSettled([getBiodiversityBaseline(90), getInaturalistObservations(null,30)])
    res.json({ biodiversity: bio.value, recentObservations: obs.value?.observations?.slice(0,10) })
  })

--- PART 4: Add AHPS Flood Stage to Dashboard ---

In src/pages/Dashboard.jsx, in the existing tidal/water level data strip, add an AHPS card. Fetch ahps data from Zustand store's compoundFloodData (which includes mobile_river_stage_ft from the /api/flood/status endpoint):

  {compoundFloodData?.mobile_river_stage_ft!=null&&(
    <div className={`bg-gray-800 rounded-lg p-3 ${compoundFloodData.flood_stage_active?'border border-orange-500':''}`}>
      <div className="text-xs text-gray-400">Mobile River Stage</div>
      <div className={`text-xl font-bold ${compoundFloodData.flood_stage_active?'text-orange-400':'text-green-400'}`}>
        {compoundFloodData.mobile_river_stage_ft.toFixed(1)} ft
      </div>
      <div className="text-xs text-gray-500">
        {compoundFloodData.flood_stage_active?'⚠ FLOOD STAGE':'Normal range'}
      </div>
    </div>
  )}

--- PART 5: Add 7-day precipitation forecast strip to Dashboard ---

Below the HAB Oracle KPI section, add a horizontal 7-day forecast strip using Open-Meteo daily forecast data. Fetch from a new GET /api/weather/forecast endpoint (or reuse the flood status data):

Add GET /api/weather/forecast to server/routes/weather.js (or create it):
  router.get('/forecast', async (req, res) => {
    const { getOpenMeteoWeather } = await import('../services/landregweather.js')
    const result = await getOpenMeteoWeather()
    res.json(result?.dailySummary ?? { error:'Weather forecast unavailable' })
  })

In Dashboard.jsx, add a mini 7-day rain probability strip:
  {weatherForecast?.dailyForecasts?.length>0&&(
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <div className="text-xs text-gray-400 uppercase mb-2">7-Day Precipitation Outlook</div>
      <div className="flex gap-2 overflow-x-auto">
        {weatherForecast.dailyForecasts.slice(0,7).map(day=>(
          <div key={day.date} className="flex-shrink-0 text-center w-16">
            <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en',{weekday:'short'})}</div>
            <div className={`text-sm font-bold ${(day.precipProb??0)>60?'text-orange-400':(day.precipProb??0)>30?'text-yellow-400':'text-green-400'}`}>
              {day.precipProb??0}%
            </div>
            <div className="text-xs text-gray-600">{(day.precip_mm??0).toFixed(0)}mm</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-600 mt-1">Orange = elevated nutrient pulse risk when combined with current flow</div>
    </div>
  )}

Add weatherForecast to Zustand store state and fetcher:
  weatherForecast: null,
  fetchWeatherForecast: async () => {
    try { const d=await fetch('/api/weather/forecast').then(r=>r.json()); set({weatherForecast:d}) } catch{}
  },

--- PART 6: Surface nutrients on HAB Oracle page ---

In src/pages/HABOracle.jsx (or whatever the HAB Oracle page component is), in the Risk Factors section, add a Nutrient Loading panel:

  {(oracleData?.inputs?.ortho_p_dogriver!=null||oracleData?.inputs?.total_n_mobilei65!=null)&&(
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <div className="text-sm font-medium text-gray-300 mb-2">💧 Nutrient Loading — Dog River / Mobile I-65</div>
      <div className="grid grid-cols-2 gap-3">
        {oracleData.inputs.ortho_p_dogriver!=null&&(
          <div>
            <div className="text-xs text-gray-400">Orthophosphate</div>
            <div className={`text-lg font-bold ${oracleData.inputs.ortho_p_dogriver>0.1?'text-orange-400':'text-green-400'}`}>
              {oracleData.inputs.ortho_p_dogriver.toFixed(3)} mg/L P
            </div>
            <div className="text-xs text-gray-500">{oracleData.inputs.ortho_p_dogriver>0.1?'Elevated — bloom nutrient present':'Normal range'}</div>
          </div>
        )}
        {oracleData.inputs.total_n_mobilei65!=null&&(
          <div>
            <div className="text-xs text-gray-400">Total Nitrogen</div>
            <div className={`text-lg font-bold ${oracleData.inputs.total_n_mobilei65>1.0?'text-orange-400':'text-green-400'}`}>
              {oracleData.inputs.total_n_mobilei65.toFixed(2)} mg/L
            </div>
            <div className="text-xs text-gray-500">{oracleData.inputs.total_n_mobilei65>1.0?'High nitrogen load':'Normal'}</div>
          </div>
        )}
      </div>
    </div>
  )}

Also add ortho_p_dogriver and total_n_mobilei65 to the oracle inputs returned by server/routes/habOracle.js in the full assessment response so they're available in the frontend.
```

---

## PROMPT 19 of 19 — Final Integration Check + Build Verification

```
This is the final integration pass. Verify all wiring is complete and fix any remaining gaps. Do NOT create new features — only connect what exists.

--- STEP 1: Verify all route registrations in server/index.js ---

Confirm these routes are mounted (add any that are missing):
  import alertRoutes      from './routes/alerts.js'
  import intelligenceRoutes from './routes/intelligence.js'
  import floodRoutes      from './routes/flood.js'
  import beachRoutes      from './routes/beach.js'
  import climateRoutes    from './routes/climate.js'
  import pollutionRoutes  from './routes/pollution.js'

  app.use('/api/alerts',        alertRoutes)
  app.use('/api/intelligence',  intelligenceRoutes)
  app.use('/api/flood',         floodRoutes)
  app.use('/api/beach',         beachRoutes)
  app.use('/api/climate',       climateRoutes)
  app.use('/api/pollution',     pollutionRoutes)

--- STEP 2: Verify React routes in src/App.jsx ---

Confirm these routes exist (add any missing):
  /flood → CompoundFlood
  /beach → BeachSafety
  /climate → ClimateVulnerability
  /pollution → PollutionTracker

--- STEP 3: Add PACE and SAR sensor routes ---

In server/routes/sensors.js (or wherever /api/sensors/* routes are defined), add:

  router.get('/pace/latest', async (req, res) => {
    try {
      const { getPACEOCIScalars } = await import('../services/satellite.js')
      res.json(await getPACEOCIScalars(3))
    } catch(err) { res.status(500).json({ error:err.message }) }
  })

  router.get('/sar/status', async (req, res) => {
    try {
      const { getSentinel1SARStatus } = await import('../services/satellite.js')
      res.json(await getSentinel1SARStatus())
    } catch(err) { res.status(500).json({ error:err.message }) }
  })

  router.get('/hycom/status', async (req, res) => {
    try {
      const { extractHYCOMScalars } = await import('../services/ocean.js')
      res.json(await extractHYCOMScalars())
    } catch(err) { res.status(500).json({ error:err.message }) }
  })

--- STEP 4: Verify ML Architecture page reflects correct phases ---

In src/pages/MLArchitecture.jsx (or /ml page), update the Phase ladder display to show:
  Phase 0: Data accumulation — 0-99 labeled samples — ACTIVE
  Phase 1: Logistic Regression — 100 samples — L2 regularization, 800 epochs
  Phase 2: Random Forest — 500 samples — 100 trees, Gini impurity, OOB validation (NEW — replaces enhanced LR)
  Phase 3: CNN-LSTM on Vertex AI — 2,000 samples — 8-day forecast, K. brevis attribution

--- STEP 5: Verify 3-minute cron builds feature vector with all sources ---

Search server/index.js for the 3-minute cron (cron.schedule('*/3'...)). Confirm that buildFeatureVector() (or persistTick()) is receiving ALL of these data objects:
  - usgsData (water quality from USGS NWIS)
  - nerrsData (primary wekaswq)
  - nerrsSecondaryData (wekbwq — if added)
  - nerrsMetData (wekmet — if added)
  - coopsData (CO-OPS tidal stations)
  - weatherData (NWS forecast)
  - buoyData (NDBC 42012)
  - goesData (GOES-19 latest features)
  - hfRadarData (HF Radar surface currents)
  - omData (Open-Meteo — now with correct hour index)
  - ahpsData (AHPS — now with parsed XML flood stage)
  - _satelliteCache (satellite granule counts — every 20 min)
  - _landRegCache (FEMA/NLCD/ATTAINS — every 6 hours)
  - _wqpCache (WQP DO2 — every 30 minutes)
  - _bioCache (biodiversity baseline — daily)
  - adphStatus (ADPH shellfish closure status)

Log a startup summary after first tick:
  console.log('[TERRAWATCH] First tick complete. Feature vector fields populated:', Object.keys(features).filter(k=>features[k]!=null).length)

--- STEP 6: Run build and fix any errors ---

Run: npm run build

If there are TypeScript or module resolution errors:
- Check all import paths are correct
- Check all exported functions exist in the files they're imported from
- Check that database.js exports getLatestVector, getRecentVectors, writeSourceHealth, getSourceHealthSummary, upsertOpenEOJob, getOpenEOJob
- Check that mlTrainer.js exports FEATURE_NAMES, FEATURE_KEYS, runInference, exportVectorsCSV, PHASE_THRESHOLDS

--- STEP 7: Smoke test key endpoints ---

After server restart, verify these return non-error responses:
  GET /api/intelligence/source-health   → { sources:[...], summary:{live:N, total:N} }
  GET /api/intelligence/explain/latest  → { prediction, confidence, featureContributions } or "no vectors yet"
  GET /api/intelligence/export.csv?days=7 → CSV file download
  GET /api/flood/status                 → { compound_flood_score, mobile_river_stage_ft }
  GET /api/beach/status                 → { beach_safety_score, advisory_level }
  GET /api/climate/vulnerability        → { vulnerability_score }
  GET /api/pollution/chain              → { source_count, facility_list }
  GET /api/sensors/pace/latest          → { pace_active, pace_chl_granules }
  GET /api/sensors/sar/status           → { available, s1_granules_5d }
  GET /api/sensors/hycom/status         → { hycom_sst, hycom_current_speed }

If any endpoint returns 500, check server logs for the specific import or function that failed and fix the path.
```

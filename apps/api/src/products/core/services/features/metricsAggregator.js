import { getLatestSnapshotForSource } from '../../../../data/database.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

async function getSourceData() {
  const [ports, usgs, nws, erddap, epa, gcoos, habBulletin] = await Promise.allSettled([
    getLatestSnapshotForSource('noaa_ports'),
    getLatestSnapshotForSource('usgs_gauges'),
    getLatestSnapshotForSource('nws_forecast'),
    getLatestSnapshotForSource('erddap_ocean_color'),
    getLatestSnapshotForSource('epa_echo'),
    getLatestSnapshotForSource('gcoos_buoys'),
    getLatestSnapshotForSource('noaa_hab_bulletin'),
  ]);

  return {
    ports:       ports.status === 'fulfilled'       ? ports.value?.data       : null,
    usgs:        usgs.status === 'fulfilled'        ? usgs.value?.data        : null,
    nws:         nws.status === 'fulfilled'         ? nws.value?.data         : null,
    erddap:      erddap.status === 'fulfilled'      ? erddap.value?.data      : null,
    epa:         epa.status === 'fulfilled'          ? epa.value?.data         : null,
    gcoos:       gcoos.status === 'fulfilled'        ? gcoos.value?.data       : null,
    habBulletin: habBulletin.status === 'fulfilled'  ? habBulletin.value?.data : null,
  };
}

function computeHABOracle(src) {
  let score = 0;

  const chl = Array.isArray(src.erddap)
    ? src.erddap.find(d => d.dataset_id === 'erdMH1chla8day')
    : null;
  if (chl?.stats) {
    const p90 = chl.stats.p90 ?? 0;
    if (p90 > 10)     score += 35;
    else if (p90 > 5) score += 20;
    else if (p90 > 2) score += 10;
  }

  if (src.habBulletin?.bulletin?.near_mobile_bay > 5) score += 30;
  else if (src.habBulletin?.bulletin?.near_mobile_bay > 0) score += 15;

  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;
  const salinity = dauIsl?.readings?.salinity?.value;
  if (salinity !== null && salinity !== undefined) {
    if (salinity < 5)  score += 20;
    else if (salinity < 15) score += 10;
  }

  const mobileRiver = Array.isArray(src.usgs)
    ? src.usgs.find(g => g.site_id === '02469761')
    : null;
  const flow = mobileRiver?.readings?.streamflow?.value;
  if (flow && flow > 50000) score += 15;
  else if (flow && flow > 25000) score += 8;

  return {
    value:   clamp(score, 0, 100),
    unit:    '%',
    label:   riskLabel(score),
    updated: new Date().toISOString(),
  };
}

function computeHypoxiaForecast(src) {
  let score = 0;

  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;

  const doVal = dauIsl?.readings?.dissolved_o2?.value;
  if (doVal !== null && doVal !== undefined) {
    if (doVal < 3)  score += 35;
    else if (doVal < 5) score += 20;
    else if (doVal < 7) score += 10;
  }

  const wt = dauIsl?.readings?.water_temp?.value;
  if (wt && wt > 29)  score += 25;
  else if (wt && wt > 27) score += 12;

  const sal = dauIsl?.readings?.salinity?.value;
  if (sal !== null && sal !== undefined) {
    if (sal < 5)  score += 20;
    else if (sal < 10) score += 10;
  }

  const nwsCenter = Array.isArray(src.nws)
    ? src.nws.find(p => p.point_id === 'mobile_bay_center')
    : null;
  const windSpeed = parseFloat(nwsCenter?.hourly_48h?.[0]?.wind_speed ?? '99');
  if (windSpeed < 3)  score += 20;
  else if (windSpeed < 6) score += 10;

  return {
    value:   clamp(score, 0, 100),
    unit:    '%',
    label:   hypoxiaLabel(score),
    updated: new Date().toISOString(),
  };
}

function computeJubileePredictor(src) {
  let score = 0;

  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;

  const doVal = dauIsl?.readings?.dissolved_o2?.value;
  if (doVal !== null && doVal !== undefined) {
    if (doVal < 2)  score += 40;
    else if (doVal < 4) score += 15;
    else return { value: 0, unit: '%', label: 'Low', updated: new Date().toISOString() };
  }

  const wind = dauIsl?.readings?.wind;
  if (wind) {
    const dir = wind.direction;
    const spd = wind.speed;
    if (dir >= 80 && dir <= 170 && spd < 5)  score += 30;
    else if (dir >= 80 && dir <= 170) score += 15;
  }

  const wt = dauIsl?.readings?.water_temp?.value;
  if (wt && wt > 27) score += 20;

  const sal = dauIsl?.readings?.salinity?.value;
  if (sal !== null && sal !== undefined && sal < 10) score += 10;

  return {
    value:   clamp(score, 0, 100),
    unit:    '%',
    label:   riskLabel(score),
    updated: new Date().toISOString(),
  };
}

function computeWaterQuality(src) {
  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;

  const doVal  = dauIsl?.readings?.dissolved_o2?.value ?? null;
  const sal    = dauIsl?.readings?.salinity?.value ?? null;
  const wt     = dauIsl?.readings?.water_temp?.value ?? null;

  const mobileG = Array.isArray(src.usgs)
    ? src.usgs.find(g => g.site_id === '02469761')
    : null;
  const turb = mobileG?.readings?.turbidity?.value ?? null;

  return {
    value:   doVal,
    unit:    'mg/L DO',
    label:   doVal ? doQualityLabel(doVal) : 'No data',
    secondary: {
      salinity:    sal ? { value: sal,  unit: 'PSU' } : null,
      water_temp:  wt  ? { value: wt,   unit: '°C'  } : null,
      turbidity:   turb ? { value: turb, unit: 'FNU' } : null,
    },
    updated: new Date().toISOString(),
  };
}

function computeCompoundFlood(src) {
  let score = 0;

  const nwsCenter = Array.isArray(src.nws)
    ? src.nws.find(p => p.point_id === 'mobile_bay_center')
    : null;
  const maxPrecip = nwsCenter?.max_precip_chance_24h ?? 0;
  if (maxPrecip >= 80) score += 40;
  else if (maxPrecip >= 60) score += 25;
  else if (maxPrecip >= 40) score += 12;

  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;
  const waterLevel = dauIsl?.readings?.water_level?.value;
  if (waterLevel && waterLevel > 0.5)  score += 30;
  else if (waterLevel && waterLevel > 0.3) score += 15;

  const alRiver = Array.isArray(src.usgs)
    ? src.usgs.find(g => g.site_id === '02428400')
    : null;
  const flow = alRiver?.readings?.streamflow?.value;
  if (flow && flow > 60000) score += 30;
  else if (flow && flow > 35000) score += 15;

  return {
    value:   clamp(score, 0, 100),
    unit:    '%',
    label:   riskLabel(score),
    updated: new Date().toISOString(),
  };
}

function computeBeachSafety(src, habScore) {
  let score = 100;

  score -= Math.round(habScore * 0.4);

  const dauIsl = Array.isArray(src.ports)
    ? src.ports.find(p => p.station_id === '8735180')
    : null;
  const doVal = dauIsl?.readings?.dissolved_o2?.value;
  if (doVal !== null && doVal !== undefined) {
    if (doVal < 3) score -= 30;
    else if (doVal < 5) score -= 15;
  }

  const buoy = Array.isArray(src.gcoos)
    ? src.gcoos.find(b => b.buoy_id === '42012')
    : null;
  const waveH = buoy?.readings?.wave_height?.value;
  if (waveH && waveH > 2)  score -= 15;
  else if (waveH && waveH > 1) score -= 8;

  const wt = dauIsl?.readings?.water_temp?.value;
  if (wt && (wt > 32 || wt < 15)) score -= 10;

  return {
    value:   clamp(Math.round(score), 0, 100),
    unit:    '/ 100',
    label:   beachSafetyLabel(score),
    updated: new Date().toISOString(),
  };
}

function computePollutionTracker(src) {
  let level = 0;

  const epaFlags = src.epa?.flags ?? [];
  if (epaFlags.includes('SPRING_LOADING_SEASON')) level += 1;
  if (epaFlags.includes('SUMMER_BLOOM_SEASON'))   level += 1;

  const mobileG = Array.isArray(src.usgs)
    ? src.usgs.find(g => g.site_id === '02469761')
    : null;
  const turb = mobileG?.readings?.turbidity?.value;
  if (turb && turb > 100) level += 3;
  else if (turb && turb > 50) level += 2;
  else if (turb && turb > 20) level += 1;

  const labels = ['Good', 'Moderate', 'Moderate', 'Elevated', 'High', 'High'];
  return {
    value:   clamp(level, 0, 5),
    unit:    '/ 5',
    label:   labels[clamp(level, 0, 5)],
    updated: new Date().toISOString(),
  };
}

export async function computeAllMetrics() {
  const src = await getSourceData();

  const habOracle     = computeHABOracle(src);
  const hypoxia       = computeHypoxiaForecast(src);
  const jubilee       = computeJubileePredictor(src);
  const waterQuality  = computeWaterQuality(src);
  const compoundFlood = computeCompoundFlood(src);
  const beachSafety   = computeBeachSafety(src, habOracle.value);
  const pollution     = computePollutionTracker(src);

  return {
    computed_at: new Date().toISOString(),
    metrics: {
      hab_oracle: {
        id:    'hab_oracle',
        title: 'HAB Oracle',
        badge: 'WORLD FIRST',
        ...habOracle,
      },
      hypoxia_forecast: {
        id:    'hypoxia_forecast',
        title: 'Hypoxia Forecast',
        badge: 'WORLD FIRST',
        ...hypoxia,
      },
      jubilee_predictor: {
        id:    'jubilee_predictor',
        title: 'Jubilee Predictor',
        badge: 'LIVE',
        ...jubilee,
      },
      water_quality: {
        id:    'water_quality',
        title: 'Water Quality Monitor',
        badge: 'LIVE',
        ...waterQuality,
      },
      compound_flood: {
        id:    'compound_flood',
        title: 'Compound Flood',
        badge: 'LIVE',
        ...compoundFlood,
      },
      beach_safety: {
        id:    'beach_safety',
        title: 'Beach Safety Index',
        badge: 'LIVE',
        ...beachSafety,
      },
      pollution_tracker: {
        id:    'pollution_tracker',
        title: 'Pollution Tracker',
        badge: 'DEVELOPING',
        ...pollution,
      },
    },
  };
}

function riskLabel(score) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Elevated';
  if (score >= 20) return 'Moderate';
  return 'Low';
}

function hypoxiaLabel(score) {
  if (score >= 70) return 'Critical';
  if (score >= 55) return 'Elevated';
  if (score >= 30) return 'Moderate';
  return 'Low';
}

function doQualityLabel(do_val) {
  if (do_val >= 8)  return 'Excellent';
  if (do_val >= 6)  return 'Good';
  if (do_val >= 4)  return 'Fair';
  if (do_val >= 2)  return 'Poor';
  return 'Hypoxic';
}

function beachSafetyLabel(score) {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Caution';
  return 'Warning';
}

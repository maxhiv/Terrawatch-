import axios from 'axios'

const SSURGO_BASE   = 'https://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService/post.rest'
const NWI_BASE      = 'https://fwsprimary.wim.usgs.gov/nwi/rest/services/Wetlands'
const FEMA_BASE     = 'https://msc.fema.gov/arcgis/rest/services'
const NLCD_BASE     = 'https://www.mrlc.gov/api'
const ATTAINS_BASE  = 'https://attains.epa.gov/attains-public/api'
const USACE_BASE    = 'https://permits.ops.usace.army.mil/orm-public'
const OPENMETEO_URL = 'https://api.open-meteo.com/v1/forecast'
const AHPS_BASE     = 'https://water.weather.gov/ahps2/hydrograph_to_xml.php'
const NCEI_BASE     = 'https://www.ncei.noaa.gov/cdo-web/api/v2'

const MOB_LAT = 30.5, MOB_LON = -88.0

export async function getOpenMeteoWeather(lat = MOB_LAT, lon = MOB_LON) {
  try {
    const { data } = await axios.get(OPENMETEO_URL, {
      params: {
        latitude:          lat,
        longitude:         lon,
        hourly:            'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,surface_pressure,cape',
        daily:             'precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,precipitation_probability_max',
        wind_speed_unit:   'ms',
        precipitation_unit:'mm',
        timezone:          'America/Chicago',
        forecast_days:     7,
      },
      timeout: 10000,
    })
    return {
      available:   true,
      product:     'Open-Meteo (free, no key)',
      note:        'HAB Oracle weather forcing. 7-day forecast + hourly current conditions.',
      lat:         data.latitude,
      lon:         data.longitude,
      timezone:    data.timezone,
      current:     data.hourly ? {
        temp_c:    data.hourly.temperature_2m?.[0],
        wind_ms:   data.hourly.wind_speed_10m?.[0],
        wind_dir:  data.hourly.wind_direction_10m?.[0],
        precip_mm: data.hourly.precipitation?.[0],
        cape:      data.hourly.cape?.[0],
      } : null,
      dailyForecast: data.daily?.time?.map((t, i) => ({
        date:        t,
        precip_mm:   data.daily.precipitation_sum?.[i],
        maxWind_ms:  data.daily.wind_speed_10m_max?.[i],
        windDir:     data.daily.wind_direction_10m_dominant?.[i],
        precipProb:  data.daily.precipitation_probability_max?.[i],
      })),
    }
  } catch(err) {
    return { available: false, product: 'Open-Meteo', error: err.message }
  }
}

export async function getAHPSFloodStage(gageId = 'MBLM6') {
  try {
    const { data } = await axios.get(AHPS_BASE, {
      params: {
        gage:  gageId,
        type:  'both',
        output:'xml',
      },
      timeout: 10000,
    })
    return {
      available: true,
      product:   'NOAA AHPS Flood Stage',
      gageId,
      note:      'Flood-driven stormwater pulse modeling. Nonpoint source loading event trigger.',
      rawXml:    typeof data === 'string' ? data.substring(0, 500) : null,
    }
  } catch(err) {
    return {
      available:  false,
      product:    'NOAA AHPS',
      note:       'Flood stage + QPF for watershed nonpoint source loading events',
      gageIds:    ['MBLM6 (Mobile River at Mobile)', 'HMLA1 (Halls Mill Creek)', 'CLNA1 (Conecuh River)'],
      baseUrl:    'https://water.weather.gov/ahps/',
      error:      err.message,
    }
  }
}

export async function getNCEIClimateNormals(stationId = 'GHCND:USW00013894', daysBack = 30) {
  const key = process.env.NCEI_API_KEY
  if (!key) {
    return {
      available:   false,
      reason:      'NCEI_API_KEY not configured',
      registerAt:  'https://www.ncdc.noaa.gov/cdo-web/token (free, email delivery)',
      addToReplit: 'Add NCEI_API_KEY to Replit Secrets',
      stationId,
      note:        '30-year climate baseline for HAB Oracle anomaly detection calibration',
    }
  }

  try {
    const end   = new Date().toISOString().split('T')[0]
    const start = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]
    const { data } = await axios.get(`${NCEI_BASE}/data`, {
      params: {
        datasetid:  'GHCND',
        stationid:  stationId,
        startdate:  start,
        enddate:    end,
        datatypeid: 'TMAX,TMIN,PRCP,AWND',
        units:      'metric',
        limit:      1000,
      },
      headers: { token: key },
      timeout: 15000,
    })
    return {
      available: true,
      product:   'NOAA NCEI Daily Climate Records',
      station:   stationId,
      records:   data?.results?.length || 0,
      data:      data?.results?.slice(0, 30) || [],
    }
  } catch(err) {
    return { available: false, product: 'NOAA NCEI', error: err.message }
  }
}

export async function getSSURGOHydricSoils(lat = MOB_LAT, lon = MOB_LON) {
  try {
    const query = `SELECT mu.muname, mu.musym, c.comppct_r, c.majcompflag
      FROM mapunit mu
      INNER JOIN component c ON mu.mukey = c.mukey
      WHERE c.hydricrating = 'Yes'
      ORDER BY mu.muname`

    const { data } = await axios.post(SSURGO_BASE, `query=${encodeURIComponent(query)}&format=JSON&p_pagination_timeout=3`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 12000,
    })
    return {
      available:   true,
      product:     'NRCS SSURGO Hydric Soils',
      note:        'WetlandAI hydric soil criterion. Peat subsidence carbon density. PFAS soil transport.',
      records:     data?.Table?.length || 0,
      data:        data?.Table?.slice(0, 20) || [],
    }
  } catch(err) {
    return {
      available:   false,
      product:     'NRCS SSURGO',
      note:        'Access via Web Soil Survey (WSS) WFS or SSURGO API',
      wfsEndpoint: 'https://services.nationalmap.gov/arcgis/rest/services/USGSStnlTrnsport/MapServer/0/query',
      mapUrl:      'https://websoilsurvey.nrcs.usda.gov/app/',
      error:       err.message,
    }
  }
}

export async function getNWIWetlands(lat = MOB_LAT, lon = MOB_LON, radiusMiles = 10) {
  const radiusMeters = radiusMiles * 1609.34
  try {
    const { data } = await axios.get(`${NWI_BASE}/Wetlands/MapServer/0/query`, {
      params: {
        where:       `1=1`,
        geometry:    `${lon},${lat}`,
        geometryType:'esriGeometryPoint',
        inSR:        4326,
        spatialRel:  'esriSpatialRelIntersects',
        distance:    radiusMeters,
        units:       'esriSRUnit_Meter',
        outFields:   'WETLAND_TYPE,ACRES,ATTRIBUTE',
        returnGeometry: false,
        f:           'json',
      },
      timeout: 12000,
    })
    return {
      available:     true,
      product:       'USGS National Wetlands Inventory',
      note:          'WetlandAI prior probability layer. Starting point for preliminary delineation.',
      wetlandCount:  data?.features?.length || 0,
      wetlands:      (data?.features || []).slice(0, 20).map(f => ({
        type:   f.attributes?.WETLAND_TYPE,
        acres:  f.attributes?.ACRES,
        code:   f.attributes?.ATTRIBUTE,
      })),
    }
  } catch(err) {
    return {
      available:    false,
      product:      'USGS NWI',
      note:         'National Wetlands Inventory — WetlandAI prior probability layer',
      wfsEndpoint:  'https://fwsprimary.wim.usgs.gov/nwi/rest/services/Wetlands/MapServer/0/query',
      downloadUrl:  'https://www.fws.gov/program/national-wetlands-inventory/wetlands-mapper',
      error:        err.message,
    }
  }
}

export async function getFEMAFloodZone(lat = MOB_LAT, lon = MOB_LON) {
  try {
    const { data } = await axios.get(`${FEMA_BASE}/NSS/NFHL/MapServer/28/query`, {
      params: {
        where:        '1=1',
        geometry:     `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR:         4326,
        spatialRel:   'esriSpatialRelIntersects',
        outFields:    'ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH',
        f:            'json',
      },
      timeout: 12000,
    })
    const features = data?.features || []
    return {
      available:   true,
      product:     'FEMA FIRM Flood Insurance Rate Map',
      note:        'Developer pre-screen flood risk in SITEVAULT. WetlandAI hydrology supporting evidence.',
      lat, lon,
      inFloodZone: features.length > 0,
      zones:       features.map(f => ({
        zoneType:  f.attributes?.ZONE_SUBTY,
        sfha:      f.attributes?.SFHA_TF === 'T' ? '100-yr flood zone' : 'Non-SFHA',
        staticBFE: f.attributes?.STATIC_BFE,
        depth:     f.attributes?.DEPTH,
      })),
    }
  } catch(err) {
    return {
      available:   false,
      product:     'FEMA FIRM',
      note:        'Flood zone query — used in SITEVAULT pre-screen and WetlandAI hydrology criterion',
      apiUrl:      `${FEMA_BASE}/NSS/NFHL/MapServer/28/query`,
      webApp:      'https://msc.fema.gov/portal/home',
      error:       err.message,
    }
  }
}

export async function getNLCDLandCover(lat = MOB_LAT, lon = MOB_LON) {
  try {
    const { data } = await axios.get(`${NLCD_BASE}/nlcd`, {
      params: {
        x: lon, y: lat,
        inSR: 4326,
        year: 2021,
      },
      timeout: 10000,
    })
    const code = data?.value
    const NLCD_CLASSES = {
      11: 'Open Water', 21: 'Developed Open Space', 22: 'Developed Low Intensity',
      23: 'Developed Medium Intensity', 24: 'Developed High Intensity',
      31: 'Barren Land', 41: 'Deciduous Forest', 42: 'Evergreen Forest',
      43: 'Mixed Forest', 52: 'Shrub/Scrub', 71: 'Grassland/Herbaceous',
      81: 'Pasture/Hay', 82: 'Cultivated Crops', 90: 'Woody Wetlands',
      95: 'Emergent Herbaceous Wetlands',
    }
    return {
      available:   true,
      product:     'NLCD 2021 Land Cover',
      lat, lon,
      code,
      description: NLCD_CLASSES[code] || `Code ${code}`,
      note:        'Nonpoint source attribution model land cover input. CAFO facility type prior.',
    }
  } catch(err) {
    return {
      available:   false,
      product:     'NLCD 2021',
      note:        'National Land Cover Database — 30m land use/land cover for CONUS',
      downloadUrl: 'https://www.mrlc.gov/data',
      apiUrl:      NLCD_BASE,
      error:       err.message,
    }
  }
}

export async function getATTAINSWaterbodies(huc8 = '03160203') {
  try {
    const { data } = await axios.get(`${ATTAINS_BASE}/huc12summary`, {
      params: { huc: huc8 },
      timeout: 12000,
    })
    return {
      available:    true,
      product:      'EPA ATTAINS Impaired Waters',
      huc8,
      note:         'Regulatory context for TMDL revision contracts. Dog River and Mobile Bay impairment documentation.',
      data:         data,
    }
  } catch(err) {
    try {
      const { data: d2 } = await axios.get(`${ATTAINS_BASE}/assessments`, {
        params: { state: 'AL', returnCountOnly: false },
        timeout: 12000,
      })
      return {
        available: true,
        product:   'EPA ATTAINS',
        data:      d2,
      }
    } catch(err2) {
      return {
        available:    false,
        product:      'EPA ATTAINS',
        note:         '303(d) impaired waters + TMDL status for Mobile Bay watershed',
        endpoints: {
          huc12Summary: `${ATTAINS_BASE}/huc12summary?huc=03160203`,
          assessments:  `${ATTAINS_BASE}/assessments?state=AL`,
          catchments:   `${ATTAINS_BASE}/catchmentCorrespondence?huc=03160203`,
        },
        error: err.message,
      }
    }
  }
}

export async function getUSACEPermits(stateCode = 'AL', county = 'Baldwin') {
  try {
    const { data } = await axios.get(`${USACE_BASE}/permits`, {
      params: {
        state: stateCode,
        county,
        permitType: '404',
        status: 'active',
        format: 'json',
      },
      timeout: 12000,
    })
    return {
      available: true,
      product:   'USACE Section 404 Permits',
      note:      'WetlandAI USACE permit context. Prior delineation data for sites being assessed.',
      permits:   data,
    }
  } catch(err) {
    return {
      available:    false,
      product:      'USACE Regulatory ORM',
      note:         'Section 404/10 permits + JDs for WetlandAI prior delineation context',
      publicPortal: 'https://permits.ops.usace.army.mil/orm-public',
      mobileDistrict:'https://www.sam.usace.army.mil/Missions/Regulatory/',
      apiEndpoint:  USACE_BASE,
      error:        err.message,
    }
  }
}

export async function getAllLandRegWeatherStatus() {
  const [openmeteo, ahps, ncei, ssurgo, nwi, fema, nlcd, attains] = await Promise.allSettled([
    getOpenMeteoWeather(),
    getAHPSFloodStage(),
    getNCEIClimateNormals(),
    getSSURGOHydricSoils(),
    getNWIWetlands(),
    getFEMAFloodZone(),
    getNLCDLandCover(),
    getATTAINSWaterbodies(),
  ])

  return {
    openMeteo:  openmeteo.status === 'fulfilled' ? openmeteo.value : { available: false },
    ahps:       ahps.status === 'fulfilled' ? ahps.value : { available: false },
    ncei:       ncei.status === 'fulfilled' ? ncei.value : { available: false },
    ssurgo:     ssurgo.status === 'fulfilled' ? ssurgo.value : { available: false },
    nwi:        nwi.status === 'fulfilled' ? nwi.value : { available: false },
    fema:       fema.status === 'fulfilled' ? fema.value : { available: false },
    nlcd:       nlcd.status === 'fulfilled' ? nlcd.value : { available: false },
    attains:    attains.status === 'fulfilled' ? attains.value : { available: false },
    usace:      { available: true, product: 'USACE Regulatory ORM', note: 'On-demand permit lookup' },
    totalSources: 9,
  }
}

import { fetchUSGSGauges, fetchGaugeSeries }   from './usgsGauges.js'
import { fetchNOAAPORTS }                       from './noaaPorts.js'
import { fetchNWSForecasts }                    from './nwsForecast.js'
import { fetchOceanColor, fetchChlorophyllTimeSeries } from './erddapOceanColor.js'
import { fetchWatershedNutrientLoading }        from './epaEcho.js'
import { fetchGCOOSBuoys, fetchNOAAHABBulletin } from './gulfCoast.js'
import { fetchAISVessels, fetchUSACEDredgeNotices } from './vesselTraffic.js'

export const DATA_SOURCES = [
  {
    id:          'usgs_gauges',
    label:       'USGS Stream Gauges',
    category:    'UPSTREAM',
    description: 'Flow, turbidity, temp, DO on Alabama/Tombigbee/Mobile rivers',
    provider:    'USGS NWIS',
    poll_interval_min: 15,
    free:        true,
    fetch:       fetchUSGSGauges,
  },
  {
    id:          'noaa_ports',
    label:       'NOAA PORTS Mobile Bay',
    category:    'IN_BAY',
    description: 'Water level, salinity, temp, wind at Dauphin Island and upper bay',
    provider:    'NOAA CO-OPS',
    poll_interval_min: 6,
    free:        true,
    fetch:       fetchNOAAPORTS,
  },
  {
    id:          'nws_forecast',
    label:       'NWS Point Forecast',
    category:    'ATMOSPHERIC',
    description: '48hr hourly + 7-day wind, precip forecast for Mobile Bay grid points',
    provider:    'NOAA NWS',
    poll_interval_min: 60,
    free:        true,
    fetch:       fetchNWSForecasts,
  },
  {
    id:          'erddap_ocean_color',
    label:       'NOAA CoastWatch Ocean Color',
    category:    'DOWNSTREAM',
    description: 'MODIS + VIIRS chlorophyll-a and SST for Northern Gulf of Mexico',
    provider:    'NOAA CoastWatch',
    poll_interval_min: 720,
    free:        true,
    fetch:       fetchOceanColor,
  },
  {
    id:          'epa_echo',
    label:       'EPA ECHO NPDES Loading',
    category:    'UPSTREAM',
    description: 'Nutrient discharge events from permitted facilities in watershed',
    provider:    'EPA ECHO',
    poll_interval_min: 1440,
    free:        true,
    fetch:       fetchWatershedNutrientLoading,
  },
  {
    id:          'gcoos_buoys',
    label:       'GCOOS / NDBC Buoys',
    category:    'DOWNSTREAM',
    description: 'Offshore water conditions from Gulf buoys near Mobile Bay',
    provider:    'GCOOS / NDBC',
    poll_interval_min: 30,
    free:        true,
    fetch:       fetchGCOOSBuoys,
  },
  {
    id:          'noaa_hab_bulletin',
    label:       'NOAA HAB Bulletin (Gulf)',
    category:    'DOWNSTREAM',
    description: 'Weekly HAB satellite+model bulletin for Gulf of Mexico',
    provider:    'NOAA HABSOS',
    poll_interval_min: 360,
    free:        true,
    fetch:       fetchNOAAHABBulletin,
  },
  {
    id:          'ais_vessels',
    label:       'AIS Vessel Traffic',
    category:    'HUMAN',
    description: 'Large vessel movements in Mobile Bay shipping channel',
    provider:    'AISHub (free tier)',
    poll_interval_min: 15,
    free:        true,
    key_required: 'AISHUB_USERNAME',
    fetch:       fetchAISVessels,
  },
  {
    id:          'usace_dredge',
    label:       'USACE Dredge Operations',
    category:    'HUMAN',
    description: 'Active dredge notices from USACE Mobile District',
    provider:    'USACE Mobile District',
    poll_interval_min: 1440,
    free:        true,
    fetch:       fetchUSACEDredgeNotices,
  },
]

export async function fetchAllSources(sourceIds = null) {
  const targets = sourceIds
    ? DATA_SOURCES.filter(s => sourceIds.includes(s.id))
    : DATA_SOURCES

  const startTime = Date.now()

  const settled = await Promise.allSettled(
    targets.map(async s => {
      const t0     = Date.now()
      const data   = await s.fetch()
      const elapsed = Date.now() - t0
      return { source_id: s.id, label: s.label, category: s.category, elapsed_ms: elapsed, data }
    })
  )

  const results = {}
  const errors  = []

  for (let i = 0; i < targets.length; i++) {
    const source = targets[i]
    const result = settled[i]
    if (result.status === 'fulfilled') {
      results[source.id] = result.value
    } else {
      errors.push({ source_id: source.id, error: result.reason?.message })
      results[source.id] = { source_id: source.id, label: source.label, error: result.reason?.message }
    }
  }

  const allFlags = []
  for (const r of Object.values(results)) {
    const flags = r.data?.flags ?? []
    if (Array.isArray(flags)) allFlags.push(...flags.map(f => ({ flag: f, source: r.source_id })))
    if (Array.isArray(r.data)) {
      for (const item of r.data) {
        if (Array.isArray(item.flags)) {
          allFlags.push(...item.flags.map(f => ({ flag: f, source: r.source_id, station: item.name })))
        }
      }
    }
  }

  return {
    snapshot_time:   new Date().toISOString(),
    elapsed_ms:      Date.now() - startTime,
    sources_fetched: targets.length,
    sources_failed:  errors.length,
    errors,
    risk_flags:      allFlags,
    hab_risk_score:  computeHABRiskScore(allFlags),
    data:            results,
  }
}

const FLAG_WEIGHTS = {
  'HIGH_CHLOROPHYLL':             20,
  'ACTIVE_HAB_EVENTS_NEARBY':     18,
  'ELEVATED_HAB_ACTIVITY':        20,
  'LOW_SALINITY':                 15,
  'HIGH_TURBIDITY':               12,
  'WARM_WATER':                    10,
  'WARM_SST':                      10,
  'ELEVATED_CHLOROPHYLL':         12,
  'HIGH_FLOW':                    10,
  'RAIN_EVENT_LIKELY':             8,
  'DREDGE_ACTIVE':                 10,
  'USACE_DREDGE_NOTICES':          8,
  'ABOVE_AVERAGE_CHLOROPHYLL':     6,
  'REDUCED_SALINITY':              6,
  'SPRING_LOADING_SEASON':         5,
  'SUMMER_BLOOM_SEASON':           5,
  'CALM_CONDITIONS':               4,
  'WARM_GULF_WATER':               4,
  'PRECIP_ELEVATED':               4,
  'LARGE_VESSELS_IN_BAY':          3,
  'ONSHORE_WIND':                  3,
}

export function computeHABRiskScore(flags, habOracleProb = null) {
  if (habOracleProb !== null && habOracleProb !== undefined && Number.isFinite(habOracleProb)) {
    const prob = habOracleProb > 1 ? habOracleProb : habOracleProb * 100
    return Math.min(100, Math.round(prob))
  }

  const seen = new Set()
  let dedupedCount = 0
  for (const { flag } of flags) {
    if (!seen.has(flag)) {
      seen.add(flag)
      dedupedCount++
    }
  }
  return Math.min(100, dedupedCount * 5)
}

export {
  fetchUSGSGauges,
  fetchGaugeSeries,
  fetchNOAAPORTS,
  fetchNWSForecasts,
  fetchOceanColor,
  fetchChlorophyllTimeSeries,
  fetchWatershedNutrientLoading,
  fetchGCOOSBuoys,
  fetchNOAAHABBulletin,
  fetchAISVessels,
  fetchUSACEDredgeNotices,
}

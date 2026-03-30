import axios from 'axios'

const CDMO_BASE = 'https://cdmo.baruch.sc.edu/webservices2'

export const NERRS_STATIONS = {
  WEEKS_BAY_WQ:  'wekaswq',
  WEEKS_BAY_WQ2: 'wekbwq',
  WEEKS_BAY_MET: 'wekmet',
}

const PARAM_MAP = {
  Temp:      { label: 'Water Temp',        unit: '°C'   },
  SpCond:    { label: 'Specific Cond',     unit: 'mS/cm' },
  Sal:       { label: 'Salinity',          unit: 'ppt'  },
  DO_pct:    { label: 'DO Saturation',     unit: '%'    },
  DO_mgl:    { label: 'Dissolved Oxygen',  unit: 'mg/L' },
  pH:        { label: 'pH',               unit: ''     },
  Turb:      { label: 'Turbidity',         unit: 'NTU'  },
  ChlFluor:  { label: 'Chlorophyll Fluor', unit: 'µg/L' },
  Depth:     { label: 'Depth',             unit: 'm'    },
  Level:     { label: 'Water Level',       unit: 'm'    },
  BP:        { label: 'Barometric Press',  unit: 'mb'   },
  WSpd:      { label: 'Wind Speed',        unit: 'm/s'  },
  MaxWSpd:   { label: 'Max Wind Speed',    unit: 'm/s'  },
  Wdir:      { label: 'Wind Direction',    unit: '°'    },
  TotPAR:    { label: 'PAR (light)',       unit: 'mmol/m²' },
  TotPrec:   { label: 'Precipitation',     unit: 'mm'   },
  ATemp:     { label: 'Air Temp',          unit: '°C'   },
  RH:        { label: 'Relative Humidity', unit: '%'    },
}

export async function getNERRSLatest(stationCode = NERRS_STATIONS.WEEKS_BAY_WQ, numRecords = 24) {
  try {
    const { data } = await axios.get(`${CDMO_BASE}/exportSingleStationXML.cfm`, {
      params: { station_code: stationCode, recs: numRecords },
      timeout: 12000,
      responseType: 'text',
    })
    return parseNERRSXML(data, stationCode)
  } catch (err) {
    console.error('[NERRS CDMO]', err.message)
    return { available: false, error: err.message, station: stationCode }
  }
}

export async function getWeeksBayLatest() {
  const [wq, met] = await Promise.allSettled([
    getNERRSLatest(NERRS_STATIONS.WEEKS_BAY_WQ, 1),
    getNERRSLatest(NERRS_STATIONS.WEEKS_BAY_MET, 1),
  ])

  return {
    waterQuality: wq.value || { available: false },
    meteorological: met.value || { available: false },
    stationName: 'Weeks Bay NERR — Mobile Bay, Alabama',
    reserve: 'Weeks Bay National Estuarine Research Reserve',
    dataUrl: 'https://cdmo.baruch.sc.edu/',
    note: 'Real-time data from the instrumented dock at Weeks Bay NERR',
  }
}

export async function getWeeksBayTimeSeries(param = 'DO_mgl', days = 7) {
  const recs = days * 24
  const data = await getNERRSLatest(NERRS_STATIONS.WEEKS_BAY_WQ, Math.min(recs, 500))
  if (!data.available) return data

  return {
    ...data,
    parameter: param,
    paramMeta: PARAM_MAP[param],
    series: (data.records || [])
      .filter(r => r[param] != null)
      .map(r => ({ timestamp: r.DateTimeStamp, value: r[param] })),
  }
}

function parseNERRSXML(xmlText, stationCode) {
  try {
    const records = []
    const dataMatches = xmlText.matchAll(/<data>([\s\S]*?)<\/data>/g)

    for (const match of dataMatches) {
      const block = match[1]
      const record = {}

      const extractTag = (tag) => {
        const m = block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))
        return m ? m[1].trim() : null
      }

      record.DateTimeStamp = extractTag('DateTimeStamp')
      record.isMissing = extractTag('F_Record')?.includes('M')

      for (const [param] of Object.entries(PARAM_MAP)) {
        const raw = extractTag(param)
        if (raw && raw !== '' && raw !== 'NaN') {
          const num = parseFloat(raw)
          if (!isNaN(num)) record[param] = num
        }
      }

      if (record.DateTimeStamp && !record.isMissing) {
        records.push(record)
      }
    }

    const latest = records[0] || {}

    return {
      available: true,
      station: stationCode,
      stationName: stationCode === NERRS_STATIONS.WEEKS_BAY_WQ ? 'Weeks Bay NERR Water Quality' : stationCode,
      latestTimestamp: latest.DateTimeStamp,
      latest: Object.entries(PARAM_MAP).reduce((acc, [k, meta]) => {
        if (latest[k] != null) acc[k] = { value: latest[k], ...meta }
        return acc
      }, {}),
      records,
      recordCount: records.length,
      paramsMapped: PARAM_MAP,
    }
  } catch (err) {
    return { available: false, error: `XML parse error: ${err.message}`, station: stationCode }
  }
}

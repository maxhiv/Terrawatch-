import axios from 'axios'

const PORTS_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'

const STATIONS = [
  { id: '8735180', name: 'Dauphin Island',         role: 'bay_mouth',  position: { lat: 30.251, lon: -88.075 } },
  { id: '8735391', name: 'Dog River Bridge',        role: 'upper_bay',  position: { lat: 30.576, lon: -88.089 } },
  { id: '8736897', name: 'Coden',                   role: 'west_shore', position: { lat: 30.376, lon: -88.230 } },
]

const PRODUCTS = ['water_level', 'salinity', 'water_temperature', 'wind', 'air_temperature']

function formatNOAADate(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

async function fetchProduct(stationId, product) {
  const now     = new Date()
  const endDt   = formatNOAADate(now)
  const startDt = formatNOAADate(new Date(now - 60 * 60 * 1000))

  try {
    const { data: json } = await axios.get(PORTS_BASE, {
      params: {
        begin_date:  startDt,
        end_date:    endDt,
        station:     stationId,
        product,
        datum:       'MLLW',
        time_zone:   'gmt',
        interval:    '6min',
        units:       'metric',
        application: 'TERRAWATCH',
        format:      'json',
      },
      timeout: 12000,
    })

    if (json.error) return null
    const data = json.data ?? []
    return data.length ? data[data.length - 1] : null
  } catch {
    return null
  }
}

async function fetchCurrents(stationId) {
  try {
    const now     = new Date()
    const endDt   = formatNOAADate(now)
    const startDt = formatNOAADate(new Date(now - 60 * 60 * 1000))

    const { data: json } = await axios.get(PORTS_BASE, {
      params: {
        begin_date:  startDt,
        end_date:    endDt,
        station:     stationId,
        product:     'currents',
        time_zone:   'gmt',
        interval:    '6min',
        units:       'metric',
        application: 'TERRAWATCH',
        format:      'json',
      },
      timeout: 12000,
    })

    const data = json.data ?? []
    return data.length ? data[data.length - 1] : null
  } catch {
    return null
  }
}

export async function fetchNOAAPORTS() {
  const results = []

  for (const station of STATIONS) {
    const reading = {
      source:    'noaa_ports',
      station_id: station.id,
      name:      station.name,
      role:      station.role,
      position:  station.position,
      timestamp: new Date().toISOString(),
      readings:  {},
      flags:     [],
    }

    const [waterLevel, salinity, waterTemp, wind, airTemp, currents] = await Promise.allSettled([
      fetchProduct(station.id, 'water_level'),
      fetchProduct(station.id, 'salinity'),
      fetchProduct(station.id, 'water_temperature'),
      fetchProduct(station.id, 'wind'),
      fetchProduct(station.id, 'air_temperature'),
      fetchCurrents(station.id),
    ])

    if (waterLevel.status === 'fulfilled' && waterLevel.value) {
      const v = parseFloat(waterLevel.value.v)
      reading.readings.water_level = { value: v, unit: 'm', label: 'Water Level (MLLW)', timestamp: waterLevel.value.t }
    }

    if (salinity.status === 'fulfilled' && salinity.value) {
      const v = parseFloat(salinity.value.s ?? salinity.value.v)
      reading.readings.salinity = { value: v, unit: 'PSU', label: 'Salinity', timestamp: salinity.value.t }
      if (v < 5)  reading.flags.push('LOW_SALINITY')
      if (v < 10) reading.flags.push('REDUCED_SALINITY')
    }

    if (waterTemp.status === 'fulfilled' && waterTemp.value) {
      const v = parseFloat(waterTemp.value.v)
      reading.readings.water_temp = { value: v, unit: '°C', label: 'Water Temperature', timestamp: waterTemp.value.t }
      if (v > 28) reading.flags.push('WARM_WATER')
    }

    if (wind.status === 'fulfilled' && wind.value) {
      reading.readings.wind = {
        speed:     parseFloat(wind.value.s),
        direction: parseFloat(wind.value.d),
        gust:      parseFloat(wind.value.g),
        unit:      'm/s',
        label:     'Wind',
        timestamp: wind.value.t,
      }
    }

    if (airTemp.status === 'fulfilled' && airTemp.value) {
      reading.readings.air_temp = { value: parseFloat(airTemp.value.v), unit: '°C', label: 'Air Temperature' }
    }

    if (currents.status === 'fulfilled' && currents.value) {
      reading.readings.currents = {
        speed:     parseFloat(currents.value.s),
        direction: parseFloat(currents.value.d),
        unit:      'cm/s',
        label:     'Surface Current',
      }
    }

    results.push(reading)
  }

  return results
}

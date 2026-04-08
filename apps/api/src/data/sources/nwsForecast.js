import axios from 'axios'

const NWS_BASE = 'https://api.weather.gov'

const FORECAST_POINTS = [
  { id: 'mobile_bay_center', label: 'Mobile Bay Center',           lat: 30.45, lon: -87.93, position: { lat: 30.45, lon: -87.93 } },
  { id: 'dauphin_island',    label: 'Dauphin Island / Bay Mouth',  lat: 30.25, lon: -88.08, position: { lat: 30.25, lon: -88.08 } },
  { id: 'mobile_delta',      label: 'Mobile Delta / Upper Bay',    lat: 30.72, lon: -88.00, position: { lat: 30.72, lon: -88.00 } },
]

const NWS_HEADERS = {
  'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)',
  'Accept': 'application/geo+json',
}

async function resolveGridURL(lat, lon) {
  const { data: json } = await axios.get(`${NWS_BASE}/points/${lat},${lon}`, {
    headers: NWS_HEADERS,
    timeout: 10000,
  })
  return {
    hourlyURL: json.properties?.forecastHourly,
    weeklyURL: json.properties?.forecast,
    gridId:    json.properties?.gridId,
    gridX:     json.properties?.gridX,
    gridY:     json.properties?.gridY,
    timezone:  json.properties?.timeZone,
  }
}

async function fetchHourlyForecast(hourlyURL) {
  const { data: json } = await axios.get(hourlyURL, {
    headers: NWS_HEADERS,
    timeout: 15000,
  })
  const periods = json.properties?.periods ?? []

  return periods.slice(0, 48).map(p => ({
    start_time:          p.startTime,
    end_time:            p.endTime,
    temp_f:              p.temperature,
    temp_unit:           p.temperatureUnit,
    wind_speed:          p.windSpeed,
    wind_direction:      p.windDirection,
    wind_dir_degrees:    compassToDegrees(p.windDirection),
    precip_chance:       p.probabilityOfPrecipitation?.value ?? 0,
    short_forecast:      p.shortForecast,
    icon:                p.icon,
    is_daytime:          p.isDaytime,
  }))
}

async function fetchWeeklyForecast(weeklyURL) {
  const { data: json } = await axios.get(weeklyURL, {
    headers: NWS_HEADERS,
    timeout: 15000,
  })
  const periods = json.properties?.periods ?? []

  return periods.slice(0, 14).map(p => ({
    name:            p.name,
    start_time:      p.startTime,
    temp_f:          p.temperature,
    wind_speed:      p.windSpeed,
    wind_direction:  p.windDirection,
    precip_chance:   p.probabilityOfPrecipitation?.value ?? 0,
    detailed:        p.detailedForecast,
    short_forecast:  p.shortForecast,
    is_daytime:      p.isDaytime,
  }))
}

export async function fetchNWSForecasts() {
  const results = []

  for (const point of FORECAST_POINTS) {
    try {
      const grid = await resolveGridURL(point.lat, point.lon)

      const [hourly, weekly] = await Promise.allSettled([
        fetchHourlyForecast(grid.hourlyURL),
        fetchWeeklyForecast(grid.weeklyURL),
      ])

      const next24h = hourly.status === 'fulfilled' ? hourly.value.slice(0, 24) : []
      const flags = []

      const maxPrecip = Math.max(...next24h.map(h => h.precip_chance), 0)
      if (maxPrecip >= 70) flags.push('RAIN_EVENT_LIKELY')
      if (maxPrecip >= 50) flags.push('PRECIP_ELEVATED')

      const windDirs = next24h.map(h => h.wind_dir_degrees).filter(d => d !== null)
      const dominantDir = windDirs.length ? average(windDirs) : null
      if (dominantDir !== null) {
        if (dominantDir >= 160 && dominantDir <= 250) flags.push('ONSHORE_WIND')
        if (dominantDir >= 0 && dominantDir <= 70)   flags.push('DOWN_BAY_WIND')
      }

      results.push({
        source:       'noaa_nws',
        point_id:     point.id,
        label:        point.label,
        position:     point.position,
        grid:         { id: grid.gridId, x: grid.gridX, y: grid.gridY },
        timezone:     grid.timezone,
        timestamp:    new Date().toISOString(),
        hourly_48h:   hourly.status === 'fulfilled' ? hourly.value : [],
        weekly_14d:   weekly.status === 'fulfilled' ? weekly.value : [],
        flags,
        max_precip_chance_24h: maxPrecip,
        dominant_wind_dir:     dominantDir,
      })

    } catch (err) {
      results.push({
        source:   'noaa_nws',
        point_id: point.id,
        label:    point.label,
        error:    err.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return results
}

function compassToDegrees(dir) {
  const map = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
    E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  }
  return map[dir] ?? null
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

import axios from 'axios'

const ERDDAP_BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap'

const BBOX = {
  minLat:  29.5,
  maxLat:  31.5,
  minLon: -89.5,
  maxLon: -87.0,
}

const DATASETS = [
  { id: 'erdMH1chla8day', variable: 'chlorophyll', label: 'MODIS Aqua Chlorophyll-a (8-day)', unit: 'mg/m³', sensor: 'MODIS_Aqua' },
  { id: 'erdVH2018chla8day', variable: 'chla', label: 'VIIRS SNPP Chlorophyll-a (8-day)', unit: 'mg/m³', sensor: 'VIIRS_SNPP' },
  { id: 'erdMH1sstd8day', variable: 'sst', label: 'MODIS Sea Surface Temperature (8-day)', unit: '°C', sensor: 'MODIS_Aqua' },
]

function buildERDDAPUrl(dataset, variable) {
  const latRange = `[${BBOX.minLat}:1:${BBOX.maxLat}]`
  const lonRange = `[${BBOX.minLon}:1:${BBOX.maxLon}]`
  return `${ERDDAP_BASE}/${dataset}.csvp?${variable}[last]${latRange}${lonRange}`
}

function parseERDDAPCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return null

  const values = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    const val = parseFloat(parts[parts.length - 1])
    if (!isNaN(val) && val > 0) values.push(val)
  }

  if (!values.length) return null

  values.sort((a, b) => a - b)
  const n   = values.length
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    count:   n,
    min:     values[0],
    max:     values[n - 1],
    mean:    sum / n,
    median:  values[Math.floor(n / 2)],
    p75:     values[Math.floor(n * 0.75)],
    p90:     values[Math.floor(n * 0.90)],
    p95:     values[Math.floor(n * 0.95)],
  }
}

export async function fetchOceanColor() {
  const results = []

  for (const ds of DATASETS) {
    try {
      const url = buildERDDAPUrl(ds.id, ds.variable)

      const { data: csvText } = await axios.get(url, {
        headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)' },
        timeout: 30000,
        responseType: 'text',
      })

      const stats = parseERDDAPCSV(csvText)

      const flags = []
      if (stats && ds.variable !== 'sst') {
        if (stats.p90 > 10)  flags.push('HIGH_CHLOROPHYLL')
        if (stats.p90 > 5)   flags.push('ELEVATED_CHLOROPHYLL')
        if (stats.mean > 3)  flags.push('ABOVE_AVERAGE_CHLOROPHYLL')
      }
      if (stats && ds.variable === 'sst') {
        if (stats.mean > 29) flags.push('WARM_SST')
        if (stats.mean > 27) flags.push('ELEVATED_SST')
      }

      results.push({
        source:     'noaa_erddap',
        dataset_id: ds.id,
        label:      ds.label,
        sensor:     ds.sensor,
        variable:   ds.variable,
        unit:       ds.unit,
        bbox:       BBOX,
        stats,
        flags,
        timestamp:  new Date().toISOString(),
      })

    } catch (err) {
      results.push({
        source:     'noaa_erddap',
        dataset_id: ds.id,
        label:      ds.label,
        error:      err.message,
        timestamp:  new Date().toISOString(),
      })
    }
  }

  return results
}

export async function fetchChlorophyllTimeSeries(datasetId = 'erdMH1chla8day', nComposites = 8) {
  const url = `${ERDDAP_BASE}/${datasetId}.csvp?chlorophyll[last-${nComposites}:1:last][${BBOX.minLat}:1:${BBOX.maxLat}][${BBOX.minLon}:1:${BBOX.maxLon}]`

  const { data: csvText } = await axios.get(url, {
    headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0' },
    timeout: 60000,
    responseType: 'text',
  })

  const lines = csvText.trim().split('\n').slice(1)

  const timeMap = {}
  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length < 4) continue
    const t   = parts[0]
    const val = parseFloat(parts[3])
    if (!isNaN(val) && val > 0) {
      if (!timeMap[t]) timeMap[t] = []
      timeMap[t].push(val)
    }
  }

  return Object.entries(timeMap).map(([t, vals]) => ({
    timestamp: t,
    mean_chl:  vals.reduce((a, b) => a + b, 0) / vals.length,
    n_pixels:  vals.length,
  })).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

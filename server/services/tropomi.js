import axios from 'axios'

const COPERNICUS_BASE = 'https://catalogue.dataspace.copernicus.eu/odata/v1'
const CMR_BASE = 'https://cmr.earthdata.nasa.gov/search'

const AOI = { west:-88.8, east:-87.5, south:30.0, north:31.2 }
const MOBILE_BAY_WKT = `POLYGON((${AOI.west} ${AOI.south},${AOI.east} ${AOI.south},${AOI.east} ${AOI.north},${AOI.west} ${AOI.north},${AOI.west} ${AOI.south}))`

function getCopernicusAuth() {
  const u = process.env.COPERNICUS_USER
  const p = process.env.COPERNICUS_PASS
  if (!u || !p) return null
  return `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`
}

function getNASAAuth() {
  const u = process.env.NASA_EARTHDATA_USER
  const p = process.env.NASA_EARTHDATA_PASS
  if (!u || !p) return null
  return `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`
}

export async function searchTROPOMIGranules(daysBack = 5) {
  const copAuth = getCopernicusAuth()
  const nasaAuth = getNASAAuth()

  if (!copAuth && !nasaAuth) {
    return {
      available: false, configured: false,
      message: 'No satellite methane credentials configured',
      options: [
        'Option A (Copernicus): Register at dataspace.copernicus.eu',
        'Option B (NASA Earthdata): Register at urs.earthdata.nasa.gov',
      ],
      note: 'MethaneSAT satellite lost contact June 20, 2025. TROPOMI on Sentinel-5P is the operational replacement.',
    }
  }

  const startDate = new Date(Date.now() - daysBack*86400000).toISOString().split('T')[0]

  if (copAuth) {
    try {
      const { data } = await axios.get(`${COPERNICUS_BASE}/Products`, {
        headers: { Authorization: copAuth },
        params: {
          $filter: `Collection/Name eq 'SENTINEL-5P' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'L2__CH4___') and ContentDate/Start gt ${startDate}T00:00:00.000Z and OData.CSC.Intersects(area=geography'SRID=4326;${MOBILE_BAY_WKT}')`,
          $orderby: 'ContentDate/Start desc',
          $top: 5,
          $expand: 'Attributes',
        },
        timeout: 15000,
      })

      const products = (data?.value || []).map(p => ({
        id: p.Id, name: p.Name,
        start: p.ContentDate?.Start,
        end: p.ContentDate?.End,
        size_mb: Math.round((p.ContentLength || 0) / 1048576),
      }))

      return { available: true, configured: true, source: 'Copernicus', products, count: products.length, latestAcquisition: products[0]?.start }
    } catch (err) {
      console.error('[TROPOMI Copernicus]', err.message)
    }
  }

  if (nasaAuth) {
    try {
      const { data } = await axios.get(`${CMR_BASE}/granules.json`, {
        headers: { Authorization: nasaAuth },
        params: {
          short_name: 'S5P_L2__CH4____HiR',
          bounding_box: `${AOI.west},${AOI.south},${AOI.east},${AOI.north}`,
          temporal: `${startDate}T00:00:00Z,${new Date().toISOString()}`,
          sort_key: '-start_date',
          page_size: 5,
        },
        timeout: 12000,
      })

      const granules = (data?.feed?.entry || []).map(g => ({
        id: g.id, title: g.title,
        time_start: g.time_start, time_end: g.time_end,
      }))

      return { available: true, configured: true, source: 'NASA CMR', granules, count: granules.length, latestAcquisition: granules[0]?.time_start }
    } catch (err) {
      console.error('[TROPOMI NASA]', err.message)
      return { available: false, configured: true, error: err.message }
    }
  }

  return { available: false, error: 'All credential attempts failed' }
}

export async function getMethaneStatus() {
  const result = await searchTROPOMIGranules(5)
  return {
    ...result,
    satellite: 'Sentinel-5P TROPOMI',
    parameter: 'Methane column (XCH4) — ppb',
    resolution: '5.5km × 3.5km',
    revisit: 'Daily global',
    wavelength: '1.6 µm SWIR',
    application: 'CAFO methane attribution',
    methanesat_note: 'MethaneSAT satellite lost June 2025. TROPOMI is the operational replacement.',
  }
}

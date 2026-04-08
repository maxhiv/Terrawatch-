import axios from 'axios'

const GOES_ERDDAP = 'https://coastwatch.pfeg.noaa.gov/erddap'

const MOB_LAT = 30.5, MOB_LON = -88.0

export async function getGOES19Status() {
  try {
    const { data } = await axios.get(`${GOES_ERDDAP}/griddap/GOES19-SST-AREA-1h.json`, {
      params: {
        latitude: `[(${MOB_LAT})]`,
        longitude: `[(${MOB_LON})]`,
        time: `[last]`,
      },
      timeout: 12000,
    })
    const rows = data?.table?.rows || []
    const cols = data?.table?.columnNames || []
    const timeIdx = cols.indexOf('time')
    const sstIdx = cols.indexOf('sst')

    return {
      available: true,
      product: 'GOES-19 ABI Sea Surface Temperature (hourly)',
      satellite: 'GOES-19 (GOES East)',
      instrument: 'Advanced Baseline Imager (ABI)',
      resolution: '2km hourly',
      latestTime: rows[0]?.[timeIdx] || null,
      latestSST_C: rows[0]?.[sstIdx] || null,
      note: 'Geostationary — continuous Gulf coverage, no key required',
    }
  } catch (err) {
    try {
      const { data } = await axios.get(`${GOES_ERDDAP}/griddap/GOES17-SST-AREA-1h.json`, {
        params: {
          latitude: `[(${MOB_LAT})]`,
          longitude: `[(${MOB_LON})]`,
          time: `[last]`,
        },
        timeout: 12000,
      })
      const rows = data?.table?.rows || []
      const cols = data?.table?.columnNames || []
      return {
        available: true,
        product: 'GOES ABI Sea Surface Temperature (hourly)',
        satellite: 'GOES East (ABI)',
        resolution: '2km hourly',
        latestTime: rows[0]?.[cols.indexOf('time')] || null,
        latestSST_C: rows[0]?.[cols.indexOf('sst')] || null,
        note: 'Geostationary — continuous Gulf coverage, no key required',
      }
    } catch (err2) {
      return {
        available: false,
        sstAvailable: false,
        imageryAvailable: true,
        product: 'GOES-19 ABI Satellite Imagery',
        satellite: 'GOES-19 (GOES East)',
        instrument: 'Advanced Baseline Imager (ABI)',
        channels: {
          band1: 'Visible (0.47µm)',
          band2: 'Red Visible (0.64µm)',
          band7: 'Shortwave IR (3.9µm)',
          band13: 'Clean IR Longwave (10.3µm)',
          band14: 'IR Longwave (11.2µm)',
        },
        resolution: '0.5-2km, 5-15 min refresh',
        imageUrl: `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/gm/GEOCOLOR/latest.jpg`,
        note: 'SST ERDDAP unavailable — imagery still accessible via NOAA STAR CDN.',
        error: err2.message,
      }
    }
  }
}

export async function getGOES19LatestImage(sector = 'gm', band = 'GEOCOLOR') {
  const validSectors = ['gm', 'se', 'car', 'FD', 'CONUS']
  const validBands = ['GEOCOLOR', 'Band02', 'Band07', 'Band13', 'Band14']
  const s = validSectors.includes(sector) ? sector : 'gm'
  const b = validBands.includes(band) ? band : 'GEOCOLOR'

  const isFullOrConus = ['FD', 'CONUS'].includes(s)
  const baseUrl = isFullOrConus
    ? `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/${s}/${b}`
    : `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/${s}/${b}`

  return {
    available: true,
    product: `GOES-19 ${s.toUpperCase()} ${b}`,
    imageUrl: `${baseUrl}/latest.jpg`,
    thumbnailUrl: `${baseUrl}/thumbnail.jpg`,
    animationUrl: `${baseUrl}/latest.gif`,
    sector: s,
    band: b,
    note: 'Direct NOAA STAR CDN — no authentication required',
    refreshRate: isFullOrConus ? '10-15 minutes' : '5 minutes (mesoscale)',
  }
}

export async function getAllGOESStatus() {
  const [status, image] = await Promise.allSettled([
    getGOES19Status(),
    getGOES19LatestImage('gm', 'GEOCOLOR'),
  ])

  return {
    status: status.status === 'fulfilled' ? status.value : { available: false },
    imagery: image.status === 'fulfilled' ? image.value : { available: false },
  }
}

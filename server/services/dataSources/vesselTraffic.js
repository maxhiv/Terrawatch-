import axios from 'axios'

const MOBILE_BAY_BBOX = {
  minLat:  30.20,
  maxLat:  30.80,
  minLon: -88.20,
  maxLon: -87.90,
}

const VESSEL_TYPE_LABEL = {
  0:  'Unknown',
  20: 'Wing in Ground',
  30: 'Fishing',
  31: 'Towing',
  32: 'Towing (large)',
  33: 'Dredging',
  34: 'Diving Ops',
  35: 'Military',
  36: 'Sailing',
  37: 'Pleasure Craft',
  50: 'Pilot Vessel',
  51: 'SAR',
  52: 'Tug',
  53: 'Port Tender',
  60: 'Passenger',
  70: 'Cargo',
  80: 'Tanker',
  90: 'Other',
}

export async function fetchAISVessels() {
  const username = process.env.AISHUB_USERNAME

  if (!username) {
    return {
      source:  'ais_aishub',
      enabled: false,
      message: 'Set AISHUB_USERNAME in Replit Secrets. Register free at aishub.net.',
      vessels: [],
      flags:   [],
    }
  }

  try {
    const { data: json } = await axios.get('https://data.aishub.net/ws.php', {
      params: {
        username,
        format:    1,
        output:    'json',
        compress:  0,
        latmin:    MOBILE_BAY_BBOX.minLat,
        latmax:    MOBILE_BAY_BBOX.maxLat,
        lonmin:    MOBILE_BAY_BBOX.minLon,
        lonmax:    MOBILE_BAY_BBOX.maxLon,
      },
      headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0' },
      timeout: 15000,
    })

    const ships = Array.isArray(json) && json.length > 1 ? json[1] : []

    const vessels = ships.map(v => ({
      mmsi:     v.MMSI,
      name:     v.NAME?.trim() || 'Unknown',
      type:     VESSEL_TYPE_LABEL[v.TYPE] ?? `Type ${v.TYPE}`,
      type_code: v.TYPE,
      lat:      parseFloat(v.LATITUDE),
      lon:      parseFloat(v.LONGITUDE),
      speed:    parseFloat(v.SOG),
      heading:  parseFloat(v.COG),
      length:   v.LENGTH ? parseInt(v.LENGTH) : null,
      draught:  v.DRAUGHT ? parseFloat(v.DRAUGHT) : null,
      timestamp: v.TIME,
    }))

    const flags = []
    const largeVessels  = vessels.filter(v => v.length && v.length >= 200)
    const dredgeVessels = vessels.filter(v => v.type_code === 33)

    if (largeVessels.length > 0)   flags.push('LARGE_VESSELS_IN_BAY')
    if (dredgeVessels.length > 0) flags.push('DREDGE_ACTIVE')

    return {
      source:       'ais_aishub',
      enabled:      true,
      timestamp:    new Date().toISOString(),
      vessel_count: vessels.length,
      vessels,
      large_vessels: largeVessels,
      active_dredges: dredgeVessels,
      flags,
    }

  } catch (err) {
    return {
      source:  'ais_aishub',
      enabled: true,
      error:   err.message,
      vessels: [],
      flags:   [],
    }
  }
}

export async function fetchUSACEDredgeNotices() {
  const result = {
    source:    'usace_mobile_district',
    timestamp: new Date().toISOString(),
    notices:   [],
    active_dredge_ops: 0,
    flags:     [],
    error:     null,
  }

  try {
    const rssURL = 'https://www.sam.usace.army.mil/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=523&isdashboardselected=0&max=50'

    const { data: xml } = await axios.get(rssURL, {
      headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)' },
      timeout: 15000,
      responseType: 'text',
    })

    const itemPattern = /<item>([\s\S]*?)<\/item>/g
    const titlePattern = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/
    const datePattern  = /<pubDate>(.*?)<\/pubDate>/
    const linkPattern  = /<link>(.*?)<\/link>/

    let match
    while ((match = itemPattern.exec(xml)) !== null) {
      const item = match[1]
      const titleM = titlePattern.exec(item)
      const dateM  = datePattern.exec(item)
      const linkM  = linkPattern.exec(item)

      const title = titleM ? (titleM[1] || titleM[2] || '').trim() : ''
      const date  = dateM ? dateM[1].trim() : ''
      const link  = linkM ? linkM[1].trim() : ''

      const isDredge = /dredg|maintenan|navigat|channel/i.test(title)

      if (isDredge || title) {
        result.notices.push({ title, date, link, is_dredge_related: isDredge })
      }
    }

    const dredgeNotices = result.notices.filter(n => n.is_dredge_related)
    result.active_dredge_ops = dredgeNotices.length

    if (dredgeNotices.length > 0) result.flags.push('USACE_DREDGE_NOTICES')
    if (dredgeNotices.length > 2) result.flags.push('MULTIPLE_DREDGE_OPS')

  } catch (err) {
    result.error = err.message
    result.notices_url = 'https://www.sam.usace.army.mil/Missions/Regulatory/Public-Notices/'
  }

  return result
}

import axios from 'axios'

const INAT_BASE      = 'https://api.inaturalist.org/v1'
const GBIF_BASE      = 'https://api.gbif.org/v1'
const EBIRD_BASE     = 'https://api.ebird.org/v2'

const SW_LAT = 29.8, SW_LNG = -89.0, NE_LAT = 31.2, NE_LNG = -87.3
const MOB_CENTER_LAT = 30.5

export async function getInaturalistObservations(taxonName = null, daysBack = 30) {
  try {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]
    const params = {
      swlat:    SW_LAT,
      swlng:    SW_LNG,
      nelat:    NE_LAT,
      nelng:    NE_LNG,
      d1:       since,
      order:    'desc',
      order_by: 'created_at',
      per_page: 50,
      quality_grade: 'research',
    }
    if (taxonName) params.taxon_name = taxonName

    const { data } = await axios.get(`${INAT_BASE}/observations`, { params, timeout: 12000 })
    return {
      available:     true,
      source:        'iNaturalist',
      taxon:         taxonName || 'all species',
      daysBack,
      totalCount:    data.total_results,
      observations:  (data.results || []).slice(0, 20).map(o => ({
        id:        o.id,
        species:   o.taxon?.name,
        commonName:o.taxon?.preferred_common_name,
        lat:       o.location?.split(',')[0],
        lon:       o.location?.split(',')[1],
        date:      o.observed_on,
        quality:   o.quality_grade,
        photoUrl:  o.photos?.[0]?.url?.replace('square', 'medium'),
      })),
    }
  } catch(err) {
    return { available: false, source: 'iNaturalist', error: err.message }
  }
}

export async function getBiodiversityBaseline(daysBack = 90) {
  try {
    const [coastal, seagrass, birds, benthic] = await Promise.allSettled([
      getInaturalistObservations('Actinopterygii', daysBack),
      getInaturalistObservations('Spartina alterniflora', daysBack),
      getInaturalistObservations('Aves', daysBack),
      getInaturalistObservations('Bivalvia', daysBack),
    ])

    return {
      available:    true,
      product:      'iNaturalist Biodiversity Baseline',
      note:         'Biodiversity crash EWS citizen science layer. Seagrass-dependent species decline signal.',
      fish:         coastal.status === 'fulfilled' ? coastal.value.totalCount : null,
      saltmarsh:    seagrass.status === 'fulfilled' ? seagrass.value.totalCount : null,
      birds:        birds.status === 'fulfilled' ? birds.value.totalCount : null,
      bivalves:     benthic.status === 'fulfilled' ? benthic.value.totalCount : null,
    }
  } catch(err) {
    return { available: false, error: err.message }
  }
}

export async function getGBIFOccurrences(speciesName, daysBack = 365) {
  try {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0]
    const params = {
      decimalLatitude:  `${SW_LAT},${NE_LAT}`,
      decimalLongitude: `${SW_LNG},${NE_LNG}`,
      eventDate:        `${since},*`,
      limit:            50,
      offset:           0,
      hasCoordinate:    true,
      hasGeospatialIssue: false,
    }
    if (speciesName) params.scientificName = speciesName

    const { data } = await axios.get(`${GBIF_BASE}/occurrence/search`, { params, timeout: 12000 })
    return {
      available:    true,
      source:       'GBIF',
      species:      speciesName || 'all',
      totalCount:   data.count,
      occurrences:  (data.results || []).slice(0, 20).map(o => ({
        key:        o.key,
        species:    o.scientificName,
        lat:        o.decimalLatitude,
        lon:        o.decimalLongitude,
        date:       o.eventDate,
        institution:o.institutionCode,
        country:    o.country,
      })),
    }
  } catch(err) {
    return { available: false, source: 'GBIF', error: err.message }
  }
}

export async function getGBIFSpeciesKey(speciesName) {
  try {
    const { data } = await axios.get(`${GBIF_BASE}/species/match`, {
      params: { name: speciesName, verbose: false },
      timeout: 8000,
    })
    return {
      available:   true,
      speciesKey:  data.usageKey,
      canonicalName: data.canonicalName,
      rank:        data.rank,
      status:      data.status,
      confidence:  data.confidence,
    }
  } catch(err) {
    return { available: false, error: err.message }
  }
}

export async function getEBirdRecentObservations(regionCode = 'US-AL', daysBack = 7) {
  const key = process.env.EBIRD_API_KEY
  if (!key) {
    return {
      available:   false,
      reason:      'EBIRD_API_KEY not configured',
      registerAt:  'https://ebird.org/api/keygen (free, instant)',
      addToReplit: 'Add EBIRD_API_KEY to Replit Secrets',
    }
  }

  try {
    const { data } = await axios.get(`${EBIRD_BASE}/data/obs/${regionCode}/recent`, {
      params: { back: daysBack, maxResults: 100 },
      headers: { 'X-eBirdApiToken': key },
      timeout: 12000,
    })
    const mobileBayObs = (data || []).filter(o =>
      o.lat >= SW_LAT && o.lat <= NE_LAT &&
      o.lng >= SW_LNG && o.lng <= NE_LNG
    )
    return {
      available:          true,
      product:            'eBird Cornell Lab Real-Time Observations',
      note:               'ALAN ecosystem disruption index + migratory flyway Gulf Coast mapping',
      totalAlabamaObs:    data?.length || 0,
      mobileBayObs:       mobileBayObs.length,
      species: [...new Set(mobileBayObs.map(o => o.comName))].slice(0, 20),
    }
  } catch(err) {
    return { available: false, source: 'eBird', error: err.message }
  }
}

export async function getEBirdHotspots() {
  const key = process.env.EBIRD_API_KEY
  if (!key) return { available: false, reason: 'EBIRD_API_KEY not configured' }

  try {
    const { data } = await axios.get(`${EBIRD_BASE}/ref/hotspot/geo`, {
      params: {
        lat:  MOB_CENTER_LAT,
        lng:  -88.0,
        dist: 50,
        fmt:  'json',
      },
      headers: { 'X-eBirdApiToken': key },
      timeout: 12000,
    })
    return {
      available: true,
      hotspots:  (data || []).slice(0, 20).map(h => ({
        id:      h.locId,
        name:    h.locName,
        lat:     h.lat,
        lon:     h.lng,
        country: h.countryName,
      })),
    }
  } catch(err) {
    return { available: false, error: err.message }
  }
}

export async function getAmeriFluxSiteInfo(siteId = 'US-GBT') {
  const token = process.env.AMERIFLUX_TOKEN

  try {
    const { data } = await axios.get(`https://ameriflux.lbl.gov/AmeriFlux/DataFiles/SiteInfo/${siteId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 12000,
    })
    return {
      available: true,
      product:   'AmeriFlux Eddy Covariance Flux Tower',
      siteId,
      data,
    }
  } catch(err) {
    return {
      available:   false,
      configured:  !!token,
      product:     'AmeriFlux Network',
      note:        'Direct CO₂/CH₄ flux measurement for Verra-approvable blue carbon MRV',
      registerAt:  'https://ameriflux.lbl.gov/data/register-data-usage/',
      nearestTowers: [
        {
          siteId:   'US-GBT',
          name:     'Grand Bay NERR (Mississippi)',
          distance: '~90km west of Mobile Bay',
          status:   'OPERATIONAL',
          habitat:  'Brackish marsh / Spartina alterniflora',
          variables:['CO2 flux', 'CH4 flux', 'latent heat', 'sensible heat', 'soil moisture'],
          dataUrl:  'https://ameriflux.lbl.gov/sites/site-summary/US-GBT',
        },
        {
          siteId:   'US-ALT',
          name:     'Alabama proposed tower — Weeks Bay NERR (target)',
          distance: '0km — target site',
          status:   'NOT YET DEPLOYED — Year 2 roadmap',
          habitat:  'Estuarine emergent wetland — Spartina alterniflora + Juncus roemerianus',
          note:     'Deploy in Year 2 via NERRS Science Collaborative + Angela Underwood partnership',
        },
      ],
      addToReplit: 'Add AMERIFLUX_TOKEN to Replit Secrets after registration',
      error: err.message,
    }
  }
}

export async function getAmeriFluxStatus() {
  const token = process.env.AMERIFLUX_TOKEN
  return {
    configured:  !!token,
    product:     'AmeriFlux Network — Eddy Covariance CO₂/CH₄ Flux',
    note:        'Blue carbon MRV — direct marsh CO₂/CH₄ flux for Verra Gold Standard methodology',
    nearestSite: 'US-GBT (Grand Bay NERR, Mississippi)',
    targetSite:  'Weeks Bay NERR, Alabama (Year 2 deployment)',
    dataFrequency: '30-minute averaged flux (standard AmeriFlux data format)',
    registration: 'https://ameriflux.lbl.gov/data/register-data-usage/',
    setupSteps: !token ? [
      '1. Register at https://ameriflux.lbl.gov/data/register-data-usage/',
      '2. Download AmeriFlux data policy agreement',
      '3. Receive JWT token by email',
      '4. Add AMERIFLUX_TOKEN to Replit Secrets',
    ] : ['Token configured — data access enabled'],
  }
}

export async function getAllEcologyStatus() {
  const [inat, gbif, ebird, ameriflux] = await Promise.allSettled([
    getInaturalistObservations(null, 7),
    getGBIFOccurrences(null, 90),
    getEBirdRecentObservations('US-AL', 7),
    getAmeriFluxStatus(),
  ])

  return {
    iNaturalist: inat.status === 'fulfilled' ? inat.value : { available: false },
    gbif:        gbif.status === 'fulfilled' ? gbif.value : { available: false },
    eBird:       ebird.status === 'fulfilled' ? ebird.value : { available: false },
    ameriflux:   ameriflux.status === 'fulfilled' ? ameriflux.value : { available: false },
    totalSources: 4,
  }
}

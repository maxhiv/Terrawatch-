import { create } from 'zustand'

const API = ''

export const useStore = create((set, get) => ({
  waterQuality: { usgs: [], coops: {}, buoy: null },
  habAssessment: null,
  weather: null,
  alerts: [],
  nerrs: null,
  hfradar: null,
  aqi: null,
  paceStatus: null,
  methane: null,
  openeo: null,
  sensors: null,
  feedStatus: null,
  epaNpdes: null,
  satelliteStatus: null,
  oceanStatus: null,
  ecologyStatus: null,
  landStatus: null,
  airplusStatus: null,
  goesStatus: null,
  goesLatest: null,

  flood: null,
  beach: null,
  climate: null,
  pollution: null,
  inference: null,
  sourceHealth: null,
  adphClosures: null,
  weatherForecast: null,

  lastUpdated: null,
  lastFetchedAt: {},
  liveMode: true,
  loading: { water: false, hab: false, weather: false, alerts: false, flood: false, beach: false, climate: false, pollution: false },

  toggleLiveMode: () => set(s => ({ liveMode: !s.liveMode })),

  fetchAll: async () => {
    const s = get()
    await Promise.allSettled([
      s.fetchWater(), s.fetchHAB(), s.fetchWeather(), s.fetchAlerts(), s.fetchSensors(),
      s.fetchNERRS?.(), s.fetchHFRadar?.(), s.fetchAQI?.(),
      s.fetchSatelliteStatus(), s.fetchOceanStatus(), s.fetchEcologyStatus(),
      s.fetchLandStatus(), s.fetchAirPlusStatus(), s.fetchGOESStatus(), s.fetchGoesLatest(),
      s.fetchFlood?.(), s.fetchBeach?.(), s.fetchClimate?.(), s.fetchPollution?.(),
      s.fetchInference?.(), s.fetchSourceHealth?.(),
    ])
    set({ lastUpdated: Date.now() })
  },

  fetchWater: async () => {
    set(s => ({ loading: { ...s.loading, water: true } }))
    try {
      const res = await fetch(`${API}/api/water/realtime`)
      const data = await res.json()
      set(s => ({
        waterQuality: {
          usgs: data.usgs || s.waterQuality.usgs,
          coops: data.coops || s.waterQuality.coops,
          buoy: data.buoy || s.waterQuality.buoy,
        },
        loading: { ...s.loading, water: false },
        lastFetchedAt: { ...s.lastFetchedAt, water: Date.now() },
      }))
    } catch (e) {
      console.error('[Store] water fetch error:', e)
      set(s => ({ loading: { ...s.loading, water: false } }))
    }
  },

  fetchHAB: async () => {
    set(s => ({ loading: { ...s.loading, hab: true } }))
    try {
      const res = await fetch(`${API}/api/hab/assess`)
      const data = await res.json()
      set(s => ({ habAssessment: data, loading: { ...s.loading, hab: false }, lastFetchedAt: { ...s.lastFetchedAt, hab: Date.now() } }))
    } catch (e) {
      console.error('[Store] HAB fetch error:', e)
      set(s => ({ loading: { ...s.loading, hab: false } }))
    }
  },

  fetchWeather: async () => {
    set(s => ({ loading: { ...s.loading, weather: true } }))
    try {
      const res = await fetch(`${API}/api/weather/current`)
      const data = await res.json()
      set(s => ({ weather: data, loading: { ...s.loading, weather: false }, lastFetchedAt: { ...s.lastFetchedAt, weather: Date.now() } }))
    } catch (e) {
      console.error('[Store] weather fetch error:', e)
      set(s => ({ loading: { ...s.loading, weather: false } }))
    }
  },

  fetchAlerts: async () => {
    set(s => ({ loading: { ...s.loading, alerts: true } }))
    try {
      const res = await fetch(`${API}/api/alerts`)
      const data = await res.json()
      set(s => ({ alerts: data.active || data.alerts || [], loading: { ...s.loading, alerts: false } }))
    } catch (e) {
      console.error('[Store] alerts fetch error:', e)
      set(s => ({ loading: { ...s.loading, alerts: false } }))
    }
  },

  fetchSensors: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/registry`)
      const data = await res.json()
      set(s => ({ sensors: data, lastFetchedAt: { ...s.lastFetchedAt, sensors: Date.now() } }))
    } catch (e) { console.error('[Store] sensors fetch error:', e) }
  },

  fetchNERRS: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/nerrs/latest`)
      const data = await res.json()
      set(s => ({ nerrs: data, lastFetchedAt: { ...s.lastFetchedAt, nerrs: Date.now() } }))
    } catch (e) {
      console.error('[Store] NERRS fetch error:', e)
      set({ nerrs: { waterQuality: { available: false, error: e.message }, meteorological: { available: false }, stationName: 'Weeks Bay NERR' } })
    }
  },

  fetchHFRadar: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/hfradar/summary`)
      const data = await res.json()
      set(s => ({ hfradar: data, lastFetchedAt: { ...s.lastFetchedAt, hfradar: Date.now() } }))
    } catch (e) {
      console.error('[Store] HF Radar fetch error:', e)
      set({ hfradar: { available: false, error: e.message } })
    }
  },

  fetchPACEStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/pace/status`)
      const data = await res.json()
      set({ paceStatus: data })
    } catch (e) { console.error('[Store] PACE fetch error:', e) }
  },

  fetchMethane: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/methane/status`)
      const data = await res.json()
      set({ methane: data })
    } catch (e) { console.error('[Store] methane fetch error:', e) }
  },

  fetchOpenEO: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/openeo/status`)
      const data = await res.json()
      set({ openeo: data })
    } catch (e) { console.error('[Store] openEO fetch error:', e) }
  },

  fetchEPANPDES: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/epa/npdes`)
      const data = await res.json()
      set({ epaNpdes: data })
    } catch (e) { console.error('[Store] EPA NPDES fetch error:', e) }
  },

  fetchAQI: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/epa/aqi`)
      const data = await res.json()
      set(s => ({ aqi: data, lastFetchedAt: { ...s.lastFetchedAt, aqi: Date.now() } }))
    } catch (e) { console.error('[Store] AQI fetch error:', e) }
  },

  fetchSatelliteStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/satellite/status`)
      const data = await res.json()
      set({ satelliteStatus: data })
    } catch (e) { console.error('[Store] satellite status error:', e) }
  },

  fetchOceanStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/ocean/status`)
      const data = await res.json()
      set({ oceanStatus: data })
    } catch (e) { console.error('[Store] ocean status error:', e) }
  },

  fetchEcologyStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/ecology/status`)
      const data = await res.json()
      set({ ecologyStatus: data })
    } catch (e) { console.error('[Store] ecology status error:', e) }
  },

  fetchLandStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/land/status`)
      const data = await res.json()
      set({ landStatus: data })
    } catch (e) { console.error('[Store] land status error:', e) }
  },

  fetchAirPlusStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/airplus/status`)
      const data = await res.json()
      set({ airplusStatus: data })
    } catch (e) { console.error('[Store] airplus status error:', e) }
  },

  fetchGOESStatus: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/goes/all`)
      const data = await res.json()
      set(s => ({ goesStatus: data, lastFetchedAt: { ...s.lastFetchedAt, goes: Date.now() } }))
    } catch (e) { console.error('[Store] GOES status error:', e) }
  },

  fetchGoesLatest: async () => {
    try {
      const res = await fetch(`${API}/api/goes19/db`)
      const data = await res.json()
      set(s => ({ goesLatest: data?.readings || null, lastFetchedAt: { ...s.lastFetchedAt, goesLatest: Date.now() } }))
    } catch (e) { console.error('[Store] GOES latest error:', e) }
  },

  fetchFlood: async () => {
    set(s => ({ loading: { ...s.loading, flood: true } }))
    try {
      const res = await fetch(`${API}/api/flood/status`)
      const data = await res.json()
      set(s => ({ flood: data, loading: { ...s.loading, flood: false }, lastFetchedAt: { ...s.lastFetchedAt, flood: Date.now() } }))
    } catch (e) {
      console.error('[Store] flood fetch error:', e)
      set(s => ({ loading: { ...s.loading, flood: false } }))
    }
  },

  fetchBeach: async () => {
    set(s => ({ loading: { ...s.loading, beach: true } }))
    try {
      const res = await fetch(`${API}/api/beach/status`)
      const data = await res.json()
      set(s => ({ beach: data, loading: { ...s.loading, beach: false }, lastFetchedAt: { ...s.lastFetchedAt, beach: Date.now() } }))
    } catch (e) {
      console.error('[Store] beach fetch error:', e)
      set(s => ({ loading: { ...s.loading, beach: false } }))
    }
  },

  fetchClimate: async () => {
    set(s => ({ loading: { ...s.loading, climate: true } }))
    try {
      const res = await fetch(`${API}/api/climate/status`)
      const data = await res.json()
      set(s => ({ climate: data, loading: { ...s.loading, climate: false }, lastFetchedAt: { ...s.lastFetchedAt, climate: Date.now() } }))
    } catch (e) {
      console.error('[Store] climate fetch error:', e)
      set(s => ({ loading: { ...s.loading, climate: false } }))
    }
  },

  fetchPollution: async () => {
    set(s => ({ loading: { ...s.loading, pollution: true } }))
    try {
      const res = await fetch(`${API}/api/pollution/status`)
      const data = await res.json()
      set(s => ({ pollution: data, loading: { ...s.loading, pollution: false }, lastFetchedAt: { ...s.lastFetchedAt, pollution: Date.now() } }))
    } catch (e) {
      console.error('[Store] pollution fetch error:', e)
      set(s => ({ loading: { ...s.loading, pollution: false } }))
    }
  },

  fetchInference: async () => {
    try {
      const res = await fetch(`${API}/api/inference/latest`)
      const data = await res.json()
      set(s => ({ inference: data, lastFetchedAt: { ...s.lastFetchedAt, inference: Date.now() } }))
    } catch (e) { console.error('[Store] inference fetch error:', e) }
  },

  fetchSourceHealth: async () => {
    try {
      const res = await fetch(`${API}/api/intelligence/source-health`)
      const data = await res.json()
      set({ sourceHealth: data })
    } catch (e) { console.error('[Store] source health error:', e) }
  },

  fetchADPH: async () => {
    try {
      const res = await fetch(`${API}/api/adph/closures`)
      const data = await res.json()
      set({ adphClosures: data })
    } catch (e) { console.error('[Store] ADPH fetch error:', e) }
  },

  fetchWeatherForecast: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/land/status`)
      const data = await res.json()
      set({ weatherForecast: data?.openMeteo?.dailyForecast || null })
    } catch (e) { console.error('[Store] weather forecast error:', e) }
  },
}))

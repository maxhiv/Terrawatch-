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

  lastUpdated: null,
  liveMode: true,
  loading: { water: false, hab: false, weather: false, alerts: false },

  toggleLiveMode: () => set(s => ({ liveMode: !s.liveMode })),

  fetchAll: async () => {
    const {
      fetchWater, fetchHAB, fetchWeather, fetchAlerts, fetchSensors,
      fetchSatelliteStatus, fetchOceanStatus, fetchEcologyStatus,
      fetchLandStatus, fetchAirPlusStatus, fetchGOESStatus,
    } = get()
    await Promise.allSettled([
      fetchWater(), fetchHAB(), fetchWeather(), fetchAlerts(), fetchSensors(),
      fetchSatelliteStatus(), fetchOceanStatus(), fetchEcologyStatus(),
      fetchLandStatus(), fetchAirPlusStatus(), fetchGOESStatus(),
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
      set(s => ({ habAssessment: data, loading: { ...s.loading, hab: false } }))
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
      set(s => ({ weather: data, loading: { ...s.loading, weather: false } }))
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
      set({ sensors: data })
    } catch (e) { console.error('[Store] sensors fetch error:', e) }
  },

  fetchNERRS: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/nerrs/latest`)
      const data = await res.json()
      set({ nerrs: data })
    } catch (e) {
      console.error('[Store] NERRS fetch error:', e)
      set({ nerrs: { waterQuality: { available: false, error: e.message }, meteorological: { available: false }, stationName: 'Weeks Bay NERR' } })
    }
  },

  fetchHFRadar: async () => {
    try {
      const res = await fetch(`${API}/api/sensors/hfradar/summary`)
      const data = await res.json()
      set({ hfradar: data })
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
      set({ aqi: data })
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
      set({ goesStatus: data })
    } catch (e) { console.error('[Store] GOES status error:', e) }
  },
}))

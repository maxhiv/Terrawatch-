import { create } from 'zustand'

export const useStore = create((set) => ({
  waterData: null,
  habData: null,
  weatherData: null,
  loading: false,
  error: null,
  setWaterData: (data) => set({ waterData: data }),
  setHabData: (data) => set({ habData: data }),
  setWeatherData: (data) => set({ weatherData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

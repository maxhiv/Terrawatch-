/**
 * USGS NWIS Service — Real-time water quality data
 * https://waterservices.usgs.gov/ — No API key required.
 */
import axios from 'axios'

const BASE = 'https://waterservices.usgs.gov/nwis/iv/'

export const MOBILE_BAY_STATIONS = {
  '02428400': 'Alabama River at Claiborne',
  '02469761': 'Mobile River at I-65 Bridge',
  '02469800': 'Mobile River near Bucks',
  '02479000': 'Dog River near Mobile',
  '02479155': 'Fowl River at Fowl River',
  '02471078': 'Escatawpa River near Agricola',
}

export const PARAMETERS = {
  '00060': 'streamflow_cfs',
  '00065': 'gage_height_ft',
  '00010': 'water_temp_c',
  '00400': 'pH',
  '00300': 'do_mg_l',
  '00095': 'conductance_us_cm',
  '00076': 'turbidity_ntu',
  '00600': 'total_nitrogen_mg_l',
  '00671': 'orthophosphate_mg_l',
}

export async function getRealtimeData(siteNos = Object.keys(MOBILE_BAY_STATIONS)) {
  try {
    const sites = siteNos.join(',')
    const paramCodes = Object.keys(PARAMETERS).join(',')
    const { data } = await axios.get(BASE, {
      params: { format: 'json', sites, parameterCd: paramCodes, siteStatus: 'active' },
      timeout: 12000,
    })

    const timeSeries = data?.value?.timeSeries || []
    const readings = {}

    for (const ts of timeSeries) {
      const siteNo = ts.sourceInfo?.siteCode?.[0]?.value
      const paramCode = ts.variable?.variableCode?.[0]?.value
      const latest = ts.values?.[0]?.value?.[0]
      if (!siteNo || !paramCode || !latest) continue

      if (!readings[siteNo]) {
        readings[siteNo] = {
          name: MOBILE_BAY_STATIONS[siteNo] || `Station ${siteNo}`,
          siteNo,
          lat: ts.sourceInfo?.geoLocation?.geogLocation?.latitude,
          lon: ts.sourceInfo?.geoLocation?.geogLocation?.longitude,
          readings: {},
          timestamp: latest.dateTime,
        }
      }

      const paramName = PARAMETERS[paramCode] || paramCode
      const val = parseFloat(latest.value)
      if (!isNaN(val)) {
        readings[siteNo].readings[paramName] = {
          value: val,
          unit: ts.variable?.unit?.unitCode,
          dateTime: latest.dateTime,
        }
      }
    }
    return Object.values(readings)
  } catch (err) {
    console.error('[USGS] Error:', err.message)
    return []
  }
}

export async function getHistoricalData(siteNo, paramCode, days = 7) {
  try {
    const endDT = new Date().toISOString().split('T')[0]
    const startDT = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    const { data } = await axios.get(BASE, {
      params: { format: 'json', sites: siteNo, parameterCd: paramCode, startDT, endDT },
      timeout: 15000,
    })

    const ts = data?.value?.timeSeries?.[0]
    if (!ts) return []
    return (ts.values?.[0]?.value || [])
      .filter(v => v.value !== '-999999')
      .map(v => ({ timestamp: v.dateTime, value: parseFloat(v.value) }))
  } catch (err) {
    console.error('[USGS] Historical error:', err.message)
    return []
  }
}

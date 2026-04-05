import axios from 'axios'

const NWIS_BASE = 'https://waterservices.usgs.gov/nwis/iv/'

const GAUGES = [
  { id: '02428400', name: 'Alabama River at Claiborne',     role: 'upstream',  position: { lat: 31.627, lon: -87.516 } },
  { id: '02469761', name: 'Mobile River at I-65 Bridge',    role: 'bay_entry', position: { lat: 30.916, lon: -88.001 } },
  { id: '02469500', name: 'Tombigbee River near Leroy',     role: 'upstream',  position: { lat: 31.463, lon: -88.103 } },
  { id: '02414500', name: 'Coosa River at Wetumpka',        role: 'headwater', position: { lat: 32.533, lon: -86.205 } },
  { id: '02422500', name: 'Cahaba River at Centreville',    role: 'headwater', position: { lat: 32.950, lon: -87.117 } },
]

const PARAM_CODES = ['00060', '63680', '00010', '00300']
const PARAM_LABELS = {
  '00060': { name: 'streamflow',   unit: 'cfs',   label: 'Streamflow' },
  '63680': { name: 'turbidity',    unit: 'FNU',   label: 'Turbidity' },
  '00010': { name: 'water_temp',   unit: '°C',    label: 'Water Temperature' },
  '00300': { name: 'dissolved_o2', unit: 'mg/L',  label: 'Dissolved Oxygen' },
}

export async function fetchUSGSGauges() {
  const siteIds = GAUGES.map(g => g.id).join(',')
  const paramCodes = PARAM_CODES.join(',')

  const { data: json } = await axios.get(NWIS_BASE, {
    params: {
      format: 'json',
      sites: siteIds,
      parameterCd: paramCodes,
      siteStatus: 'active',
    },
    headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0 (contact@terrawatch.io)' },
    timeout: 15000,
  })

  const timeSeries = json?.value?.timeSeries ?? []
  const gaugeMap = {}

  for (const ts of timeSeries) {
    const siteId  = ts.sourceInfo?.siteCode?.[0]?.value
    const paramCd = ts.variable?.variableCode?.[0]?.value
    const values  = ts.values?.[0]?.value ?? []
    const latest  = values[values.length - 1]

    if (!siteId || !paramCd || !latest) continue

    const gauge = GAUGES.find(g => g.id === siteId)
    if (!gauge) continue

    if (!gaugeMap[siteId]) {
      gaugeMap[siteId] = {
        source:    'usgs_nwis',
        site_id:   siteId,
        name:      gauge.name,
        role:      gauge.role,
        position:  gauge.position,
        timestamp: latest.dateTime,
        readings:  {},
        flags:     [],
      }
    }

    const paramInfo = PARAM_LABELS[paramCd]
    if (paramInfo) {
      const val = parseFloat(latest.value)
      gaugeMap[siteId].readings[paramInfo.name] = {
        value:   isNaN(val) ? null : val,
        unit:    paramInfo.unit,
        label:   paramInfo.label,
        raw_val: latest.value,
      }
    }
  }

  const results = Object.values(gaugeMap)

  for (const g of results) {
    const flow = g.readings.streamflow?.value
    const turb = g.readings.turbidity?.value
    if (flow && flow > 50000) g.flags.push('HIGH_FLOW')
    if (turb && turb > 50)   g.flags.push('HIGH_TURBIDITY')
  }

  return results
}

export async function fetchGaugeSeries(siteId, paramCd = '00060', hours = 168) {
  const endDt   = new Date()
  const startDt = new Date(endDt - hours * 3600 * 1000)

  const { data: json } = await axios.get(NWIS_BASE, {
    params: {
      format: 'json',
      sites: siteId,
      parameterCd: paramCd,
      startDT: startDt.toISOString().slice(0, 19),
      endDT: endDt.toISOString().slice(0, 19),
    },
    headers: { 'User-Agent': 'TERRAWATCH-HAB-Monitor/1.0' },
    timeout: 20000,
  })

  const ts       = json?.value?.timeSeries?.[0]
  const rawVals  = ts?.values?.[0]?.value ?? []

  return rawVals.map(v => ({
    t:   v.dateTime,
    val: parseFloat(v.value),
  })).filter(v => !isNaN(v.val))
}

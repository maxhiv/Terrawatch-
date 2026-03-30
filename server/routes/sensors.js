import express from 'express'
const router = express.Router()

const SENSOR_REGISTRY = [
  { id: 'usgs_nwis', name: 'USGS NWIS', type: 'water_quality', status: 'active', feeds: 22, cost: 'free' },
  { id: 'noaa_coops', name: 'NOAA CO-OPS', type: 'tidal', status: 'active', feeds: 4, cost: 'free' },
  { id: 'noaa_nws', name: 'NOAA NWS', type: 'weather', status: 'active', feeds: 1, cost: 'free' },
  { id: 'noaa_ndbc', name: 'NOAA NDBC Buoys', type: 'offshore', status: 'active', feeds: 1, cost: 'free' },
  { id: 'nasa_pace', name: 'NASA PACE OCI', type: 'satellite', status: 'pending_integration', feeds: 1, cost: 'free', worldFirst: true },
  { id: 'noaa_hf_radar', name: 'NOAA HF Radar (CoSMO)', type: 'currents', status: 'pending_integration', feeds: 1, cost: 'free', worldFirst: true },
  { id: 'methanesat', name: 'MethaneSAT', type: 'atmospheric', status: 'pending_integration', feeds: 1, cost: 'free', worldFirst: true },
  { id: 'edna_sampler', name: 'eDNA Auto-Samplers', type: 'biological', status: 'planned_month6', feeds: 1, cost: 'hardware', worldFirst: true },
  { id: 'hydrophone', name: 'Passive Acoustic (Hydrophone)', type: 'acoustic', status: 'planned_month4', feeds: 1, cost: 'hardware' },
  { id: 'lora_soil', name: 'LoRaWAN Soil Conductivity', type: 'groundwater', status: 'planned_month3', feeds: 15, cost: 'hardware' },
  { id: 'ms4_iot', name: 'MS4 Stormwater IoT', type: 'stormwater', status: 'planned_month4', feeds: 30, cost: 'partnership' },
  { id: 'wbe', name: 'Wastewater Epidemiology (WBE)', type: 'public_health', status: 'planned_year2', feeds: 1, cost: 'partnership', worldFirst: true },
  { id: 'ameriflux', name: 'AmeriFlux Flux Towers', type: 'carbon', status: 'planned_year2', feeds: 1, cost: 'partnership', worldFirst: true },
  { id: 'osprey_litter_gitter', name: 'Osprey Initiative (Litter Gitter)', type: 'microplastic', status: 'partnership', feeds: 1, cost: 'partnership', worldFirst: true },
  { id: 'vexcel', name: 'Vexcel Data Program', type: 'aerial_imagery', status: 'evaluation', feeds: 7, cost: 'paid_800mo' },
]

router.get('/registry', (req, res) => {
  res.json({
    sensors: SENSOR_REGISTRY,
    summary: {
      total: SENSOR_REGISTRY.length,
      active: SENSOR_REGISTRY.filter(s => s.status === 'active').length,
      pending: SENSOR_REGISTRY.filter(s => s.status.includes('pending')).length,
      planned: SENSOR_REGISTRY.filter(s => s.status.includes('planned')).length,
      worldFirsts: SENSOR_REGISTRY.filter(s => s.worldFirst).length,
    },
    timestamp: new Date().toISOString(),
  })
})

export default router

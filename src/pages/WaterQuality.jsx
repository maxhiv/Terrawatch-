import { useState, useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API = '/api'

const MOBILE_BAY_CENTER = [30.35, -87.95]
const DEFAULT_ZOOM = 10

const LAYERS = [
  { id: 'truecolor', label: 'True Color', icon: '🛰️', color: '#0ea5e9', desc: 'MODIS Terra true-color corrected reflectance imagery' },
  { id: 'chlorophyll', label: 'Chlorophyll', icon: '🟢', color: '#22c55e', desc: 'Estimated chlorophyll-a concentration from ocean color' },
  { id: 'sst', label: 'SST', icon: '🌡️', color: '#ef4444', desc: 'MODIS sea surface temperature (11µm, day)' },
  { id: 'viirs', label: 'VIIRS', icon: '🔵', color: '#6366f1', desc: 'VIIRS NOAA-20 corrected reflectance true color 250m' },
]

const GIBS_LAYERS = {
  truecolor: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  chlorophyll: 'MODIS_Aqua_Chlorophyll_A',
  sst: 'MODIS_Aqua_Sea_Surface_Temp_Day',
  viirs: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
}

const COOPS_COORDS = {
  '8735180': { lat: 30.2500, lon: -88.0750, name: 'Dauphin Island' },
  '8737048': { lat: 30.7083, lon: -88.0400, name: 'Mobile State Docks' },
  '8735391': { lat: 30.5650, lon: -88.0883, name: 'Dog River Bridge' },
}

const NERR_STATIONS = [
  { id: 'WKBSHMET', lat: 30.3727, lon: -87.7378, name: 'Weeks Bay NERR - Shell Mound' },
  { id: 'WKBWQBH', lat: 30.4146, lon: -87.8261, name: 'Weeks Bay NERR - Bon Secour' },
]

const NDBC_BUOYS = [
  { id: '42012', lat: 30.065, lon: -87.555, name: 'NDBC Buoy 42012 — Orange Beach Offshore' },
]

function Spinner({ size = 24 }) {
  return (
    <div className="inline-block animate-spin rounded-full border-2 border-teal-500 border-t-transparent"
      style={{ width: size, height: size }} />
  )
}

function formatDate(daysBack) {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().split('T')[0]
}

function createStationIcon(color, size = 10) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function WaterQuality() {
  const [waterQuality, setWaterQuality] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeLayer, setActiveLayer] = useState('truecolor')
  const [daysBack, setDaysBack] = useState(0)
  const [opacity, setOpacity] = useState(0.7)
  const [selectedStation, setSelectedStation] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const gibsLayerRef = useRef(null)
  const markersRef = useRef([])

  const currentLayer = LAYERS.find(l => l.id === activeLayer)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API}/water/realtime`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setWaterQuality(json)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 300000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: MOBILE_BAY_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  const updateGibsLayer = useCallback(() => {
    if (!mapInstance.current) return

    if (gibsLayerRef.current) {
      mapInstance.current.removeLayer(gibsLayerRef.current)
    }

    const layerId = GIBS_LAYERS[activeLayer]
    if (!layerId) return

    const dateStr = formatDate(daysBack)
    const gibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerId}/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`

    gibsLayerRef.current = L.tileLayer(gibsUrl, {
      opacity,
      maxNativeZoom: 9,
      maxZoom: 19,
      bounds: [[24, -98], [36, -80]],
      errorTileUrl: '',
    }).addTo(mapInstance.current)
  }, [activeLayer, daysBack, opacity])

  useEffect(() => {
    updateGibsLayer()
  }, [updateGibsLayer])

  useEffect(() => {
    if (!mapInstance.current || !waterQuality) return

    markersRef.current.forEach(m => mapInstance.current.removeLayer(m))
    markersRef.current = []

    const escapeHtml = (str) => {
      const div = document.createElement('div')
      div.textContent = String(str)
      return div.innerHTML
    }

    const addMarker = (lat, lon, color, name, id, type) => {
      const marker = L.marker([lat, lon], { icon: createStationIcon(color) })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-size:12px;color:#333;"><strong>${escapeHtml(name)}</strong><br/><span style="color:#666;">${escapeHtml(type.toUpperCase())} · ${escapeHtml(id)}</span></div>`)
        .on('click', () => setSelectedStation({ lat, lon, name, id, type }))
      markersRef.current.push(marker)
    }

    if (waterQuality.usgs) {
      waterQuality.usgs.forEach(s => {
        if (!s.lat || !s.lon) return
        const doVal = s.readings?.do_mg_l
        const doRaw = typeof doVal === 'object' ? doVal?.value : doVal
        const do2 = doRaw != null ? Number(doRaw) : NaN
        let color = '#1d6fcc'
        if (Number.isFinite(do2)) {
          color = do2 < 3 ? '#dc2626' : do2 < 5 ? '#d97706' : '#0a9e80'
        }
        addMarker(s.lat, Math.abs(s.lon) * -1, color, s.name, s.siteNo, 'usgs')
      })
    }

    Object.entries(COOPS_COORDS).forEach(([id, info]) => {
      addMarker(info.lat, info.lon, '#1d6fcc', info.name, id, 'coops')
    })

    NERR_STATIONS.forEach(s => {
      addMarker(s.lat, s.lon, '#7c3aed', s.name, s.id, 'nerr')
    })

    NDBC_BUOYS.forEach(s => {
      addMarker(s.lat, s.lon, '#d97706', s.name, s.id, 'ndbc')
    })
  }, [waterQuality])

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-bay-900 flex items-center gap-2">
              💧 Water Quality & Satellite Imagery
            </h1>
            <p className="text-xs text-bay-400 mt-0.5">
              Real-time USGS NWIS & NOAA CO-OPS monitoring — Mobile Bay watershed
            </p>
          </div>
          {loading && <Spinner size={20} />}
        </div>

        {error && (
          <div className="tw-card border-red-800 mb-2 text-xs text-red-400">
            Error fetching data: {error}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="tw-label">Satellite Layer:</span>
          {LAYERS.map(l => (
            <button key={l.id} onClick={() => setActiveLayer(l.id)}
              className={clsx('text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                activeLayer === l.id
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-bay-100 text-bay-500 border-bay-200 hover:border-bay-300')}
              style={activeLayer === l.id ? { background: l.color, borderColor: l.color } : {}}>
              {l.icon} {l.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="tw-label">Date:</span>
              {[0, 1, 2, 3].map(d => (
                <button key={d} onClick={() => setDaysBack(d)}
                  className={clsx('tw-mono text-[10px] px-2 py-1 rounded border transition-colors',
                    daysBack === d ? 'bg-teal-600 text-white border-teal-600' : 'bg-bay-100 text-bay-500 border-bay-200 hover:border-bay-300')}>
                  {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `-${d}d`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="tw-label">Opacity:</span>
              <input type="range" min="0.2" max="1" step="0.1" value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
                className="w-20 accent-teal-600" />
              <span className="tw-mono text-[10px] text-bay-400">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
        </div>

        {currentLayer && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: currentLayer.color }} />
            <span className="text-xs text-bay-400">{currentLayer.desc}</span>
            <span className="tw-mono text-[9px] text-bay-300 ml-2">{formatDate(daysBack)}</span>
            <span className="tw-mono text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 ml-auto">
              NASA GIBS — Free, No Auth Required
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-3 px-6 pb-6 min-h-0">
        <div className="flex-1 rounded-xl overflow-hidden border border-bay-200 relative shadow-sm">
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-bay-50">
              <div className="text-center">
                <Spinner size={32} />
                <div className="text-sm text-bay-400 mt-3">Loading map...</div>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-[1000] tw-card py-2 px-3 text-xs shadow-lg">
            <div className="tw-label mb-2">Station Legend</div>
            {[
              { color: '#0a9e80', label: 'DO₂ Good (>5 mg/L)' },
              { color: '#d97706', label: 'DO₂ Low (3-5 mg/L)' },
              { color: '#dc2626', label: 'DO₂ Critical (<3 mg/L)' },
              { color: '#1d6fcc', label: 'USGS (no DO data)' },
              { color: '#7c3aed', label: 'NERR Reserve' },
              { color: '#d97706', label: 'NDBC Offshore Buoy' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color, border: '1.5px solid rgba(255,255,255,0.5)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
                <span className="text-bay-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-64 flex-shrink-0 overflow-y-auto space-y-3">
          {selectedStation && (
            <div className="tw-card border-teal-700">
              <div className="tw-label text-teal-400 mb-1">Selected Station</div>
              <div className="font-semibold text-sm text-bay-800 mb-1">{selectedStation.name}</div>
              <div className="tw-mono text-[9px] text-bay-300 mb-2">{selectedStation.id} · {selectedStation.type.toUpperCase()}</div>
              <div className="text-xs text-bay-500 space-y-0.5">
                <div>Lat: {selectedStation.lat.toFixed(4)}°N</div>
                <div>Lon: {selectedStation.lon.toFixed(4)}°W</div>
              </div>
              {selectedStation.type === 'usgs' && (
                <a href={`https://waterdata.usgs.gov/monitoring-location/${selectedStation.id}/`}
                  target="_blank" rel="noreferrer"
                  className="mt-2 block text-[10px] text-teal-400 hover:underline">
                  → USGS Water Data →
                </a>
              )}
            </div>
          )}

          <div className="tw-card">
            <div className="tw-label mb-2">Live USGS Readings</div>
            {(waterQuality?.usgs || []).map(s => {
              const safeNum = (v) => {
                if (v == null) return null
                const raw = typeof v === 'object' ? v.value : v
                const n = Number(raw)
                return Number.isFinite(n) ? n : null
              }
              const do2 = safeNum(s.readings?.do_mg_l)
              const flow = safeNum(s.readings?.streamflow_cfs)
              const temp = safeNum(s.readings?.water_temp_c)
              return (
                <div key={s.siteNo} className="py-1.5 border-b border-bay-50 last:border-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                      do2 != null ? (do2 < 3 ? 'bg-red-500' : do2 < 5 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-bay-300')} />
                    <div className="text-[10px] text-bay-600 font-medium truncate">{s.name.split(' at ')[0]}</div>
                  </div>
                  <div className="flex gap-3 ml-3 tw-mono text-[9px] text-bay-400">
                    {do2 != null && <span style={{ color: do2 < 3 ? '#dc2626' : do2 < 5 ? '#d97706' : '#0a9e80' }}>DO₂ {do2.toFixed(1)}</span>}
                    {temp != null && <span>T {temp.toFixed(1)}°C</span>}
                    {flow != null && <span>{(flow / 1000).toFixed(0)}K cfs</span>}
                    {!do2 && !temp && !flow && <span className="text-bay-200">No readings</span>}
                  </div>
                </div>
              )
            })}
            {(!waterQuality?.usgs || waterQuality.usgs.length === 0) && (
              <div className="text-xs text-bay-300 py-2">Fetching station data...</div>
            )}
          </div>

          <div className="tw-card">
            <div className="tw-label mb-2">NOAA CO-OPS Tidal</div>
            {Object.values(waterQuality?.coops || {}).map(s => {
              const safeNum = (v) => {
                if (v == null) return null
                const raw = typeof v === 'object' ? v.value : v
                const n = Number(raw)
                return Number.isFinite(n) ? n : null
              }
              const wl = safeNum(s.water_level)
              const sal = safeNum(s.salinity)
              const temp = safeNum(s.water_temperature)
              return (
                <div key={s.id} className="py-1.5 border-b border-bay-50 last:border-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="text-[10px] text-bay-600 font-medium">{s.name}</div>
                  </div>
                  <div className="flex gap-3 ml-3 tw-mono text-[9px] text-bay-400">
                    {wl != null && <span className="text-blue-400">{wl.toFixed(2)} ft</span>}
                    {sal != null && <span className="text-purple-400">{sal.toFixed(1)} ppt</span>}
                    {temp != null && <span>{temp.toFixed(1)}°F</span>}
                    {!wl && !sal && !temp && <span className="text-bay-200">No readings</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="tw-card bg-blue-50 border-blue-200">
            <div className="tw-label text-blue-600 mb-1.5">Satellite Data Sources</div>
            <div className="space-y-1.5">
              {[
                { name: 'MODIS Terra/Aqua', freq: 'Daily', type: 'True Color, CHL, SST', src: 'NASA' },
                { name: 'VIIRS NOAA-20', freq: 'Daily', type: 'True Color 250m', src: 'NASA' },
                { name: 'NASA PACE OCI', freq: 'Daily', type: 'Hyperspectral (PENDING)', src: 'NASA' },
              ].map(s => (
                <div key={s.name} className="text-xs">
                  <div className="font-medium text-blue-700">{s.name}</div>
                  <div className="text-blue-500">{s.type} · {s.freq}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

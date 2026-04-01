import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../store/index.js'
import { Spinner } from '../components/Common/index.jsx'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import clsx from 'clsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

function safeNum(v) {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'object' && 'value' in v) return safeNum(v.value)
  const n = parseFloat(v); return isNaN(n) ? null : n
}
function doColor(v) { return v == null ? '#4a7060' : v < 3 ? '#dc2626' : v < 5 ? '#f59e0b' : '#10b981' }
function uvColor(uv) {
  if (uv == null) return null
  if (uv >= 11) return '#7c3aed'; if (uv >= 8) return '#dc2626'
  if (uv >= 6)  return '#f97316'; if (uv >= 3) return '#eab308'
  return '#22c55e'
}
const fmtDate = d => { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString().split('T')[0] }

const GIBS = [
  { id: 'none',      label: 'None',            icon: '○',  color: 'transparent' },
  { id: 'truecolor', label: 'True Color',       icon: '🌍', color: '#10b981', url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg' },
  { id: 'chlor',     label: 'Chlorophyll',      icon: '🟢', color: '#22c55e', url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L2_Chlorophyll_A/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png' },
  { id: 'sst',       label: 'Sea Surface Temp', icon: '🔴', color: '#ef4444', url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png' },
  { id: 'viirs',     label: 'VIIRS Night',      icon: '🌙', color: '#a855f7', url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_ENCC/default/{date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png' },
]

const STATIONS = [
  { id: '02428400', short: 'Alabama R. Claiborne', lat: 31.5317, lon: -87.5095, type: 'usgs'  },
  { id: '02469761', short: 'Mobile R. I-65',       lat: 30.7379, lon: -88.0373, type: 'usgs'  },
  { id: '02479000', short: 'Dog River',             lat: 30.6329, lon: -88.0889, type: 'usgs'  },
  { id: '02479155', short: 'Fowl River',            lat: 30.4373, lon: -88.1147, type: 'usgs'  },
  { id: '02479560', short: 'Escatawpa River',       lat: 30.6177, lon: -88.3927, type: 'usgs'  },
  { id: '8735180',  short: 'Dauphin Island',        lat: 30.2500, lon: -88.0750, type: 'coops' },
  { id: '8736897',  short: 'Mobile State Docks',    lat: 30.7084, lon: -88.0431, type: 'coops' },
  { id: '8737048',  short: 'Dog River Bridge',      lat: 30.5647, lon: -88.0884, type: 'coops' },
  { id: '42012',    short: 'Buoy 42012 (offshore)', lat: 30.065,  lon: -87.555,  type: 'ndbc'  },
  { id: 'wekaswq',  short: 'Weeks Bay NERR',        lat: 30.4167, lon: -87.8250, type: 'nerr'  },
  { id: 'nws_mob',  short: 'NWS Mobile',            lat: 30.6941, lon: -88.0431, type: 'nws'   },
]

const LIVE_LAYERS = [
  { id: 'currents', label: 'HF Currents', icon: '🌊', color: '#0ea5e9', desc: 'HF Radar surface current vector grid' },
  { id: 'wind',     label: 'Wind',        icon: '💨', color: '#fbbf24', desc: 'Wind direction arrows at all stations' },
  { id: 'waves',    label: 'Waves',       icon: '〜', color: '#8b5cf6', desc: 'Wave height ring + direction arrow at buoy' },
  { id: 'solar',    label: 'UV / Solar',  icon: '☀️', color: '#f97316', desc: 'UV index ring + PAR at NERR station' },
]

// Arrow SVG: currentArrow uses u=east/v=north m/s
function currentArrowSVG(u, v) {
  const speed = Math.sqrt(u * u + v * v)
  if (speed < 0.01) return null
  const angle = Math.atan2(u, v) * 180 / Math.PI
  const len   = Math.max(8, Math.min(26, speed * 22))
  const alpha = Math.max(0.35, Math.min(0.95, speed / 0.6))
  const col   = speed > 0.5 ? '#f97316' : speed > 0.3 ? '#22d3ee' : '#0ea5e9'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" style="overflow:visible;transform:rotate(${angle}deg);transform-origin:17px 17px"><line x1="17" y1="${17+len/2}" x2="17" y2="${17-len/2}" stroke="${col}" stroke-width="2" stroke-opacity="${alpha}" stroke-linecap="round"/><polygon points="17,${17-len/2-5} 14,${17-len/2} 20,${17-len/2}" fill="${col}" fill-opacity="${alpha}"/></svg>`
}

// windArrowSVG: dirFrom=degrees wind blows FROM (meteorological convention)
function windArrowSVG(speedMs, dirFrom, color = '#fbbf24') {
  if (speedMs == null || speedMs < 0.2) return null
  const dirTo = (dirFrom + 180) % 360
  const len   = Math.max(10, Math.min(28, speedMs * 3.5))
  const alpha = Math.max(0.5, Math.min(1, speedMs / 8))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" style="overflow:visible;transform:rotate(${dirTo}deg);transform-origin:17px 17px"><line x1="17" y1="${17+len/2}" x2="17" y2="${17-len/2}" stroke="${color}" stroke-width="2" stroke-opacity="${alpha}" stroke-linecap="round"/><polygon points="17,${17-len/2-5} 14,${17-len/2} 20,${17-len/2}" fill="${color}" fill-opacity="${alpha}"/></svg>`
}

// waveArrowSVG: MWD=direction waves travel TOWARD
function waveArrowSVG(heightM, mwd) {
  if (heightM == null || heightM < 0.05) return null
  const len   = Math.max(10, Math.min(30, heightM * 18))
  const alpha = Math.max(0.4, Math.min(0.9, heightM / 2))
  const col   = heightM > 2 ? '#c084fc' : heightM > 1 ? '#a78bfa' : '#8b5cf6'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" style="overflow:visible;transform:rotate(${mwd}deg);transform-origin:17px 17px"><line x1="17" y1="${17+len/2}" x2="17" y2="${17-len/2}" stroke="${col}" stroke-width="2.5" stroke-opacity="${alpha}" stroke-dasharray="3,2" stroke-linecap="round"/><polygon points="17,${17-len/2-5} 14,${17-len/2} 20,${17-len/2}" fill="${col}" fill-opacity="${alpha}"/></svg>`
}

export default function MapPage() {
  const { waterQuality, nerrs, weather, hfradar, landStatus, fetchNERRS, fetchHFRadar } = useStore()
  const mapRef        = useRef(null)
  const leafMap       = useRef(null)
  const gibsLayer     = useRef(null)
  const markersRef    = useRef([])
  const currentRefs   = useRef([])
  const windRefs      = useRef([])
  const waveRefs      = useRef([])
  const solarRefs     = useRef([])

  const [activeGibs,    setActiveGibs]    = useState('none')
  const [daysBack,      setDaysBack]      = useState(0)
  const [opacity,       setOpacity]       = useState(0.7)
  const [showLabels,    setShowLabels]    = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [ready,         setReady]         = useState(false)
  const [activeLayers,  setActiveLayers]  = useState(new Set())
  const [loadingLayer,  setLoadingLayer]  = useState(null)
  const [currentVectors,setCurrentVectors]= useState(null)
  const cfg = GIBS.find(g => g.id === activeGibs)

  const getData = useCallback((st) => {
    if (st.type === 'usgs') {
      const s = waterQuality?.usgs?.find(u => u.siteNo === st.id)
      if (!s) return null
      return { do2: safeNum(s.readings?.do_mg_l), temp: safeNum(s.readings?.water_temp_c), flow: safeNum(s.readings?.streamflow_cfs), gage: safeNum(s.readings?.gage_height_ft), orthoP: safeNum(s.readings?.orthophosphate_mg_l) }
    }
    if (st.type === 'coops') {
      const c = waterQuality?.coops?.[st.id]
      if (!c) return null
      return { wl: safeNum(c.water_level), temp: safeNum(c.water_temperature), sal: safeNum(c.salinity), windSpd: safeNum(c.wind?.value), airPres: safeNum(c.air_pressure?.value), airTemp: safeNum(c.air_temperature?.value) }
    }
    if (st.type === 'ndbc') {
      const b = waterQuality?.buoy
      if (!b) return null
      return { temp: safeNum(b.WTMP), wspd: safeNum(b.WSPD), wdir: safeNum(b.WDIR), gust: safeNum(b.GST), wvht: safeNum(b.WVHT), dpd: safeNum(b.DPD), mwd: safeNum(b.MWD), pres: safeNum(b.PRES) }
    }
    if (st.type === 'nerr') {
      const n  = nerrs?.waterQuality?.latest
      const nm = nerrs?.meteorological?.latest
      return n ? { do2: safeNum(n.DO_mgl?.value), temp: safeNum(n.Temp?.value), sal: safeNum(n.Sal?.value), chl: safeNum(n.ChlFluor?.value), wspd: safeNum(nm?.WSpd?.value), wdir: safeNum(nm?.Wdir?.value), par: safeNum(nm?.TotPAR?.value), precip: safeNum(nm?.TotPrec?.value) } : null
    }
    if (st.type === 'nws') {
      const w = weather?.current
      if (!w) return null
      const toMs = mph => mph != null ? mph / 2.237 : null
      return { temp: safeNum(w.temp_f), wspd: w.wind_speed_ms ?? toMs(w.wind_speed_mph), wdir: safeNum(w.wind_direction), gust: w.wind_gust_ms ?? toMs(w.wind_gust_mph), humid: safeNum(w.humidity), pres: safeNum(w.pressure_mb) }
    }
    return null
  }, [waterQuality, nerrs, weather])

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafMap.current) return
    const map = L.map(mapRef.current, { center: [30.45, -87.9], zoom: 9, zoomControl: true })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Esri' }).addTo(map)
    leafMap.current = map
    setReady(true)
    fetchNERRS(); fetchHFRadar()
    return () => { map.remove(); leafMap.current = null }
  }, [])

  // GIBS layer
  useEffect(() => {
    const map = leafMap.current; if (!map) return
    if (gibsLayer.current) { map.removeLayer(gibsLayer.current); gibsLayer.current = null }
    if (activeGibs === 'none' || !cfg?.url) return
    gibsLayer.current = L.tileLayer(cfg.url.replace('{date}', fmtDate(daysBack)), { opacity, maxNativeZoom: 9, maxZoom: 18, attribution: 'NASA GIBS' }).addTo(map)
  }, [activeGibs, daysBack, opacity, cfg])

  // Station markers
  useEffect(() => {
    const map = leafMap.current; if (!map || !ready) return
    markersRef.current.forEach(m => map.removeLayer(m)); markersRef.current = []

    STATIONS.filter(st => st.type !== 'nws').forEach(st => {
      const data  = getData(st)
      const color = st.type === 'coops' ? '#3b82f6' : st.type === 'ndbc' ? '#f59e0b' : st.type === 'nerr' ? '#7c3aed' : doColor(data?.do2)
      const icon  = L.divIcon({ className: '', iconSize: [14,14], html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>` })
      const m = L.marker([st.lat, st.lon], { icon }).addTo(map)

      const lines = [`<strong style="font-size:12px">${st.short}</strong>`]
      if (data?.do2   != null) lines.push(`<span style="color:${doColor(data.do2)}">DO₂: ${data.do2.toFixed(1)} mg/L</span>`)
      if (data?.temp  != null) lines.push(`Temp: ${data.temp.toFixed(1)}°C`)
      if (data?.sal   != null) lines.push(`Salinity: ${data.sal.toFixed(1)} ppt`)
      if (data?.wl    != null) lines.push(`Level: ${data.wl.toFixed(2)} ft`)
      if (data?.flow  != null) lines.push(`Flow: ${(data.flow/1000).toFixed(1)}K cfs`)
      if (data?.gage  != null) lines.push(`Gage height: ${data.gage.toFixed(2)} ft`)
      if (data?.chl   != null) lines.push(`Chlorophyll: ${data.chl.toFixed(1)} µg/L`)
      if (data?.wvht  != null) lines.push(`Waves: ${data.wvht.toFixed(1)} m · ${data.dpd?.toFixed(0) ?? '?'} s period`)
      if (data?.mwd   != null) lines.push(`Wave dir → ${data.mwd.toFixed(0)}°`)
      if (data?.par   != null) lines.push(`PAR: ${data.par.toFixed(0)} mmol/m²`)
      if (data?.precip!= null) lines.push(`Precip: ${data.precip.toFixed(1)} mm`)
      if (data?.orthoP!= null) lines.push(`Ortho-P: ${data.orthoP.toFixed(3)} mg/L`)
      if (data?.airPres!= null) lines.push(`Air pres: ${data.airPres.toFixed(1)} mb`)
      m.bindPopup(`<div style="font-size:11px;line-height:1.7">${lines.join('<br>')}</div>`)
      if (showLabels) m.bindTooltip(st.short, { permanent: true, direction: 'right', offset: [8,0], className: 'leaflet-label-tw' })
      markersRef.current.push(m)
    })
  }, [ready, waterQuality, nerrs, weather, showLabels, getData])

  // Layer helpers
  const clearLayer = (refs) => {
    const map = leafMap.current; if (!map) return
    refs.current.forEach(m => map.removeLayer(m)); refs.current = []
  }

  const drawCurrents = useCallback(async () => {
    const map = leafMap.current; if (!map) return
    clearLayer(currentRefs)
    let vecs = currentVectors
    if (!vecs) {
      setLoadingLayer('currents')
      try { const r = await fetch(`${API}/api/sensors/hfradar/vectors`); const d = await r.json(); vecs = d.vectors || []; setCurrentVectors(vecs) }
      catch { setLoadingLayer(null); return }
      setLoadingLayer(null)
    }
    const stride = vecs.length > 300 ? 3 : vecs.length > 100 ? 2 : 1
    vecs.filter((_,i) => i % stride === 0).forEach(v => {
      if (v.u == null || v.v == null) return
      const svg = currentArrowSVG(v.u, v.v); if (!svg) return
      const icon = L.divIcon({ className: '', iconSize: [34,34], iconAnchor: [17,17], html: svg })
      currentRefs.current.push(L.marker([v.lat, v.lon], { icon, interactive: false }).addTo(map))
    })
  }, [currentVectors])

  const drawWind = useCallback(() => {
    const map = leafMap.current; if (!map) return
    clearLayer(windRefs)
    const pts = []

    const nwsD = getData({ id: 'nws_mob', type: 'nws' })
    if (nwsD?.wspd != null && nwsD?.wdir != null) pts.push({ lat: 30.6941, lon: -88.0431, speed: nwsD.wspd, dir: nwsD.wdir, label: 'NWS Mobile', color: '#fbbf24' })

    const nerrD = getData({ id: 'wekaswq', type: 'nerr' })
    if (nerrD?.wspd != null && nerrD?.wdir != null) pts.push({ lat: 30.4167, lon: -87.8250, speed: nerrD.wspd, dir: nerrD.wdir, label: 'Weeks Bay NERR', color: '#a78bfa' })

    const buoyD = getData({ id: '42012', type: 'ndbc' })
    if (buoyD?.wspd != null && buoyD?.wdir != null) pts.push({ lat: 30.065, lon: -87.555, speed: buoyD.wspd, dir: buoyD.wdir, label: 'Buoy 42012', color: '#fb923c' })

    ;[['8735180','Dauphin Is.'], ['8736897','State Docks'], ['8737048','Dog R. Bridge']].forEach(([id, label]) => {
      const c = waterQuality?.coops?.[id]; const st = STATIONS.find(s => s.id === id)
      if (c?.wind?.value != null && st) {
        const speedMs = safeNum(c.wind.value) * 0.5144  // knots → m/s
        if (speedMs > 0) pts.push({ lat: st.lat, lon: st.lon, speed: speedMs, dir: null, label, color: '#4ade80' })
      }
    })

    pts.forEach(pt => {
      const svg = windArrowSVG(pt.speed, pt.dir ?? 0, pt.color); if (!svg) return
      const icon = L.divIcon({ className: '', iconSize: [34,34], iconAnchor: [17,17], html: svg })
      const marker = L.marker([pt.lat, pt.lon], { icon }).addTo(map)
      marker.bindPopup(`<div style="font-size:11px"><strong>${pt.label}</strong><br>${pt.speed.toFixed(1)} m/s (${(pt.speed*1.944).toFixed(1)} kts)${pt.dir != null ? ` · From ${pt.dir}°` : ''}</div>`)
      windRefs.current.push(marker)
    })
  }, [getData, waterQuality])

  const drawWaves = useCallback(() => {
    const map = leafMap.current; if (!map) return
    clearLayer(waveRefs)
    const b = waterQuality?.buoy; if (!b) return
    const wvht = safeNum(b.WVHT), mwd = safeNum(b.MWD), dpd = safeNum(b.DPD), wspd = safeNum(b.WSPD), wdir = safeNum(b.WDIR)

    if (wvht != null) {
      const col = wvht > 2.5 ? '#c084fc' : wvht > 1.5 ? '#a78bfa' : '#8b5cf6'
      const circle = L.circle([30.065, -87.555], { radius: Math.max(2000, Math.min(15000, wvht * 8000)), color: col, weight: 2, fillColor: col, fillOpacity: 0.07, opacity: 0.6, dashArray: '4,4' }).addTo(map)
      circle.bindPopup(`<div style="font-size:11px"><strong>Wave energy ring</strong><br>Height: ${wvht.toFixed(2)} m<br>Period: ${dpd?.toFixed(0) ?? '?'} s<br>Direction → ${mwd?.toFixed(0) ?? '?'}°</div>`)
      waveRefs.current.push(circle)
    }
    if (wvht != null && mwd != null) {
      const svg = waveArrowSVG(wvht, mwd); if (svg) {
        const m = L.marker([30.065, -87.555], { icon: L.divIcon({ className: '', iconSize: [34,34], iconAnchor: [17,17], html: svg }) }).addTo(map)
        m.bindPopup(`<div style="font-size:11px"><strong>Mean wave direction</strong><br>→ ${mwd.toFixed(0)}° · ${wvht.toFixed(2)} m · ${dpd?.toFixed(0) ?? '?'} s</div>`)
        waveRefs.current.push(m)
      }
    }
    if (wspd != null && wdir != null) {
      const bearing = (wdir + 180) % 360, rad = bearing * Math.PI / 180
      const swell = L.polyline([[30.065, -87.555], [30.065 + Math.cos(rad)*0.25, -87.555 + Math.sin(rad)*0.35]], { color: '#8b5cf6', weight: 1.5, opacity: 0.45, dashArray: '6,4' }).addTo(map)
      swell.bindPopup(`<div style="font-size:11px">Offshore swell track<br>Wind from ${wdir}° · ${wspd.toFixed(1)} m/s</div>`)
      waveRefs.current.push(swell)
    }
  }, [waterQuality])

  const drawSolar = useCallback(() => {
    const map = leafMap.current; if (!map) return
    clearLayer(solarRefs)
    const uv  = safeNum(landStatus?.openMeteo?.current?.uv_index)
    const sol = safeNum(landStatus?.openMeteo?.current?.solar_rad_wm2)
    const par = safeNum(nerrs?.meteorological?.latest?.TotPAR?.value)

    if (uv != null) {
      const col = uvColor(uv) ?? '#eab308'
      const ring = L.circle([30.45, -87.9], { radius: Math.max(5000, Math.min(40000, uv * 3500)), color: col, weight: 2, fillColor: col, fillOpacity: 0.06, opacity: 0.55, dashArray: '3,5' }).addTo(map)
      ring.bindPopup(`<div style="font-size:11px"><strong>UV Index: ${uv.toFixed(1)}</strong><br>Solar: ${sol?.toFixed(0) ?? '?'} W/m²<br>${uv >= 11 ? 'Extreme' : uv >= 8 ? 'Very High' : uv >= 6 ? 'High' : uv >= 3 ? 'Moderate' : 'Low'}</div>`)
      solarRefs.current.push(ring)

      const uvIcon = L.divIcon({ className: '', iconSize: [44,22], iconAnchor: [22,11], html: `<div style="background:${col};color:#fff;font-size:10px;font-weight:600;padding:2px 7px;border-radius:12px;font-family:monospace;white-space:nowrap;opacity:0.9">UV ${uv.toFixed(1)}</div>` })
      solarRefs.current.push(L.marker([30.55, -87.75], { icon: uvIcon, interactive: false }).addTo(map))
    }
    if (par != null) {
      const parNorm = Math.min(1, par / 800), parCol = parNorm > 0.7 ? '#f97316' : parNorm > 0.4 ? '#eab308' : '#4ade80'
      const parC = L.circle([30.4167, -87.8250], { radius: 2500 + parNorm * 4000, color: parCol, weight: 1.5, fillColor: parCol, fillOpacity: 0.10, opacity: 0.55 }).addTo(map)
      parC.bindPopup(`<div style="font-size:11px"><strong>PAR — Weeks Bay NERR</strong><br>${par.toFixed(0)} mmol/m²<br>Bloom photosynthesis driver</div>`)
      solarRefs.current.push(parC)
    }
  }, [landStatus, nerrs])

  const toggleLayer = useCallback(async (id) => {
    const next = new Set(activeLayers)
    if (next.has(id)) {
      next.delete(id)
      if (id === 'currents') clearLayer(currentRefs)
      if (id === 'wind')     clearLayer(windRefs)
      if (id === 'waves')    clearLayer(waveRefs)
      if (id === 'solar')    clearLayer(solarRefs)
    } else {
      next.add(id)
      if (id === 'currents') await drawCurrents()
      if (id === 'wind')     drawWind()
      if (id === 'waves')    drawWaves()
      if (id === 'solar')    drawSolar()
    }
    setActiveLayers(next)
  }, [activeLayers, drawCurrents, drawWind, drawWaves, drawSolar])

  // Redraw live layers on data refresh
  useEffect(() => {
    if (activeLayers.has('wind'))  drawWind()
    if (activeLayers.has('waves')) drawWaves()
    if (activeLayers.has('solar')) drawSolar()
  }, [waterQuality, nerrs, weather, landStatus])

  const uvNow  = safeNum(landStatus?.openMeteo?.current?.uv_index)
  const solNow = safeNum(landStatus?.openMeteo?.current?.solar_rad_wm2)
  const parNow = safeNum(nerrs?.meteorological?.latest?.TotPAR?.value)

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>

      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-2 bg-white border-b border-bay-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="font-bold text-sm text-bay-800" style={{ fontFamily: 'Syne,sans-serif' }}>Satellite Map</div>
            <div className="text-[9px] text-bay-300 tw-mono">Esri WorldImagery + NASA GIBS · {STATIONS.length} stations · 4 live layers</div>
          </div>
          <div className="h-5 w-px bg-bay-100" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="tw-label">Satellite:</span>
            {GIBS.map(l => (
              <button key={l.id} onClick={() => setActiveGibs(l.id)}
                className="text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all"
                style={activeGibs===l.id?{background:l.color==='transparent'?'#f0faf5':l.color,color:l.color==='transparent'?'#4a7060':'#fff',borderColor:l.color==='transparent'?'#cce4d8':l.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>
          {activeGibs !== 'none' && (
            <>
              <div className="h-5 w-px bg-bay-100" />
              <div className="flex items-center gap-1">
                {[0,1,2,3].map(d => (
                  <button key={d} onClick={() => setDaysBack(d)}
                    className={clsx('tw-mono text-[9px] px-2 py-1 rounded border', daysBack===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-400 border-bay-200')}>
                    {d===0?'Today':d===1?'Yesterday':`-${d}d`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input type="range" min="0.2" max="1" step="0.05" value={opacity} onChange={e=>setOpacity(parseFloat(e.target.value))} className="w-14 accent-teal-600" />
                <span className="tw-mono text-[9px] text-bay-300">{Math.round(opacity*100)}%</span>
              </div>
            </>
          )}
          <div className="ml-auto">
            <button onClick={() => setShowLabels(s=>!s)}
              className={clsx('text-[10px] px-2.5 py-1 rounded-lg border font-medium', showLabels?'bg-teal-50 text-teal-700 border-teal-200':'bg-white text-bay-400 border-bay-200')}>
              {showLabels?'◉ Labels':'○ Labels'}
            </button>
          </div>
        </div>

        {/* Live layer toggles */}
        <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-bay-50 flex-wrap">
          <span className="tw-label flex-shrink-0">Live layers:</span>
          {LIVE_LAYERS.map(layer => (
            <button key={layer.id} onClick={() => toggleLayer(layer.id)} disabled={loadingLayer===layer.id} title={layer.desc}
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all disabled:opacity-50"
              style={activeLayers.has(layer.id)?{background:layer.color,color:'#fff',borderColor:layer.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
              {loadingLayer===layer.id?<Spinner size={10}/>:layer.icon} {layer.label}
            </button>
          ))}
          {activeLayers.has('solar') && uvNow != null && (
            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-bay-100">
              <div className="w-2 h-2 rounded-full" style={{ background: uvColor(uvNow) ?? '#eab308' }} />
              <span className="tw-mono text-[9px] font-bold" style={{ color: uvColor(uvNow) ?? '#eab308' }}>UV {uvNow.toFixed(1)}</span>
              {solNow != null && <span className="tw-mono text-[9px] text-bay-400">{solNow.toFixed(0)} W/m²</span>}
              {parNow != null && <span className="tw-mono text-[9px] text-bay-400">PAR {parNow.toFixed(0)}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Map + sidebar */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!ready && <div className="absolute inset-0 flex items-center justify-center bg-bay-50"><Spinner size={32}/></div>}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000]" style={{ background: 'rgba(10,30,24,0.88)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', minWidth: 190 }}>
            <div className="tw-mono text-[8px] text-teal-400 mb-2 tracking-widest">STATIONS</div>
            {[{c:'#10b981',l:'DO₂ Good (>5)'},{c:'#f59e0b',l:'DO₂ Low (3–5)'},{c:'#dc2626',l:'DO₂ Critical (<3)'},{c:'#3b82f6',l:'CO-OPS Tidal'},{c:'#7c3aed',l:'NERR Reserve'},{c:'#f59e0b',l:'NDBC Buoy'}].map(i => (
              <div key={i.l} className="flex items-center gap-2 mb-1">
                <div style={{ width:12, height:12, borderRadius:'50%', background:i.c, border:'2px solid rgba(255,255,255,0.7)', flexShrink:0 }} />
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.75)', fontFamily:'JetBrains Mono,monospace' }}>{i.l}</span>
              </div>
            ))}
            {activeLayers.size > 0 && (
              <>
                <div className="tw-mono text-[8px] text-teal-400 mt-2 mb-1.5 tracking-widest border-t border-teal-900 pt-1.5">LIVE LAYERS</div>
                {activeLayers.has('currents') && <div className="flex items-center gap-2 mb-1"><div style={{width:24,height:2,background:'linear-gradient(90deg,#0ea5e9,#f97316)'}} /><span style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontFamily:'monospace'}}>HF Currents (u/v)</span></div>}
                {activeLayers.has('wind')     && <div className="flex items-center gap-2 mb-1"><div style={{width:24,height:2,background:'#fbbf24'}} /><span style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontFamily:'monospace'}}>Wind vectors</span></div>}
                {activeLayers.has('waves')    && <div className="flex items-center gap-2 mb-1"><div style={{width:24,height:2,borderTop:'2px dashed #8b5cf6'}} /><span style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontFamily:'monospace'}}>Wave energy / dir</span></div>}
                {activeLayers.has('solar')    && <div className="flex items-center gap-2 mb-1"><div style={{width:12,height:12,borderRadius:'50%',background:uvColor(uvNow)??('' || '#eab308'),opacity:0.8}} /><span style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontFamily:'monospace'}}>UV / Solar / PAR</span></div>}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 overflow-y-auto bg-white border-l border-bay-100 p-3 space-y-1.5">
          <div className="tw-label mb-2">All Stations — Live</div>
          {STATIONS.map(st => {
            const data = getData(st); const do2 = data?.do2; const alert = do2 != null && do2 < 4
            return (
              <div key={st.id}
                className={clsx('p-2 rounded-lg border cursor-pointer transition-all', selected?.id===st.id?'border-teal-400 bg-teal-50':alert?'border-red-200 bg-red-50':'border-bay-100 hover:border-bay-200 bg-bay-50')}
                onClick={() => { setSelected(st); if (leafMap.current) leafMap.current.setView([st.lat,st.lon],11,{animate:true}) }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.type==='coops'?'#3b82f6':st.type==='ndbc'?'#f59e0b':st.type==='nerr'?'#7c3aed':st.type==='nws'?'#6b7280':doColor(do2) }} />
                  <div className="text-[11px] font-semibold text-bay-700 truncate">{st.short}</div>
                  <div className="tw-mono text-[8px] text-bay-300 ml-auto">{st.type}</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {do2     != null && <span className="tw-mono text-[10px] font-bold" style={{color:doColor(do2)}}>{do2.toFixed(1)} mg/L</span>}
                  {data?.temp  != null && <span className="tw-mono text-[10px] text-bay-400">{data.temp.toFixed(1)}°C</span>}
                  {data?.flow  != null && <span className="tw-mono text-[10px] text-bay-400">{(data.flow/1000).toFixed(0)}K</span>}
                  {data?.wl    != null && <span className="tw-mono text-[10px] text-blue-600">{data.wl.toFixed(1)} ft</span>}
                  {data?.sal   != null && <span className="tw-mono text-[10px] text-purple-600">{data.sal.toFixed(1)} ppt</span>}
                  {data?.wspd  != null && <span className="tw-mono text-[10px] text-amber-600">{data.wspd.toFixed(1)} m/s</span>}
                  {data?.wvht  != null && <span className="tw-mono text-[10px] text-violet-600">{data.wvht.toFixed(1)} m</span>}
                  {data?.chl   != null && <span className="tw-mono text-[10px] text-green-600">{data.chl.toFixed(1)} µg/L</span>}
                  {data?.par   != null && <span className="tw-mono text-[10px] text-orange-500">☀{data.par.toFixed(0)}</span>}
                  {!data && <span className="tw-mono text-[9px] text-bay-300">No data</span>}
                </div>
              </div>
            )
          })}

          {/* Solar panel */}
          {(uvNow != null || solNow != null || parNow != null) && (
            <div className="mt-2 p-2.5 rounded-lg border border-orange-100 bg-orange-50">
              <div className="tw-label mb-1.5 text-orange-700">☀️ Solar / UV · Mobile Bay</div>
              {uvNow  != null && <div className="flex justify-between text-[10px] mb-1"><span className="text-bay-500">UV Index</span><span className="tw-mono font-bold" style={{color:uvColor(uvNow)??(''||'#eab308')}}>{uvNow.toFixed(1)} — {uvNow>=8?'Very High':uvNow>=6?'High':uvNow>=3?'Moderate':'Low'}</span></div>}
              {solNow != null && <div className="flex justify-between text-[10px] mb-1"><span className="text-bay-500">Solar Rad</span><span className="tw-mono text-orange-700">{solNow.toFixed(0)} W/m²</span></div>}
              {parNow != null && <div className="flex justify-between text-[10px]"><span className="text-bay-500">PAR (NERR)</span><span className="tw-mono text-orange-700">{parNow.toFixed(0)} mmol/m²</span></div>}
            </div>
          )}

          {/* Wave panel */}
          {(() => { const b = waterQuality?.buoy; const wvht = safeNum(b?.WVHT); return wvht != null ? (
            <div className="p-2.5 rounded-lg border border-violet-100 bg-violet-50">
              <div className="tw-label mb-1.5 text-violet-700">〜 Offshore Waves · Buoy 42012</div>
              <div className="flex justify-between text-[10px] mb-1"><span className="text-bay-500">Height</span><span className="tw-mono font-bold text-violet-700">{wvht.toFixed(2)} m</span></div>
              {safeNum(b?.DPD) != null && <div className="flex justify-between text-[10px] mb-1"><span className="text-bay-500">Period</span><span className="tw-mono text-violet-600">{safeNum(b.DPD).toFixed(0)} s</span></div>}
              {safeNum(b?.APD) != null && <div className="flex justify-between text-[10px] mb-1"><span className="text-bay-500">Avg period</span><span className="tw-mono text-violet-600">{safeNum(b.APD).toFixed(0)} s</span></div>}
              {safeNum(b?.MWD) != null && <div className="flex justify-between text-[10px]"><span className="text-bay-500">Direction →</span><span className="tw-mono text-violet-600">{safeNum(b.MWD).toFixed(0)}°</span></div>}
            </div>
          ) : null })()}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../../store/index.js'
import { Spinner } from '../../components/common/index.jsx'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import clsx from 'clsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

function safeNum(v) { if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; if(typeof v==='object'&&'value'in v)return safeNum(v.value); const n=parseFloat(v); return isNaN(n)?null:n }
function doColor(v) { return v==null?'#4a7060':v<3?'#dc2626':v<5?'#f59e0b':'#10b981' }

const fmtDate = d => { const t=new Date(); t.setDate(t.getDate()-d); return t.toISOString().split('T')[0] }

const GIBS = [
  { id:'none', label:'None', icon:'○', color:'transparent' },
  { id:'truecolor', label:'True Color', icon:'🌍', color:'#10b981', url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg' },
  { id:'chlor', label:'Chlorophyll', icon:'🟢', color:'#22c55e', url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L2_Chlorophyll_A/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png' },
  { id:'sst', label:'Sea Surface Temp', icon:'🔴', color:'#ef4444', url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png' },
  { id:'viirs', label:'VIIRS Night', icon:'🌙', color:'#a855f7', url:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_ENCC/default/{date}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png' },
]

const STATIONS = [
  { id:'02428400', short:'Alabama R. Claiborne', lat:31.5317, lon:-87.5095, type:'usgs' },
  { id:'02469761', short:'Mobile R. I-65', lat:30.7379, lon:-88.0373, type:'usgs' },
  { id:'02470629', short:'Dog R. Hwy 90', lat:30.6299, lon:-88.1063, type:'usgs' },
  { id:'02479000', short:'Dog R. nr Mobile', lat:30.6329, lon:-88.0889, type:'usgs' },
  { id:'02479155', short:'Fowl River', lat:30.4373, lon:-88.1147, type:'usgs' },
  { id:'02479560', short:'Escatawpa River', lat:30.6177, lon:-88.3927, type:'usgs' },
  { id:'8735180', short:'Dauphin Island', lat:30.2500, lon:-88.0750, type:'coops' },
  { id:'8736897', short:'Mobile State Docks', lat:30.7084, lon:-88.0431, type:'coops' },
  { id:'8737048', short:'Dog River Bridge', lat:30.5647, lon:-88.0884, type:'coops' },
  { id:'42012', short:'Buoy 42012 (offshore)', lat:30.065, lon:-87.555, type:'ndbc' },
  { id:'wekaswq', short:'Weeks Bay NERR', lat:30.4167, lon:-87.8250, type:'nerr' },
]

const LIVE_OVERLAYS = [
  { id:'currents', label:'Currents', icon:'〜', color:'#3b82f6' },
  { id:'wind',     label:'Wind',     icon:'≈', color:'#10b981' },
  { id:'waves',    label:'Waves',    icon:'≋', color:'#8b5cf6' },
  { id:'solar',    label:'Solar/UV', icon:'☀', color:'#f59e0b' },
]

export default function MapPage() {
  const { waterQuality, nerrs, hfradar, weather, landStatus } = useStore()
  const mapRef = useRef(null)
  const leafMap = useRef(null)
  const gibsLayer = useRef(null)
  const markersRef = useRef([])
  const overlayLayersRef = useRef([])

  const [activeGibs, setActiveGibs] = useState('none')
  const [daysBack, setDaysBack] = useState(0)
  const [opacity, setOpacity] = useState(0.7)
  const [showLabels, setShowLabels] = useState(true)
  const [selected, setSelected] = useState(null)
  const [ready, setReady] = useState(false)
  const [liveOverlays, setLiveOverlays] = useState({})

  const cfg = GIBS.find(g=>g.id===activeGibs)

  const getData = useCallback((st) => {
    if (st.type==='usgs') {
      const s = waterQuality?.usgs?.find(u=>u.siteNo===st.id)
      if (!s) return null
      return { do2:safeNum(s.readings?.do_mg_l), temp:safeNum(s.readings?.water_temp_c), flow:safeNum(s.readings?.streamflow_cfs) }
    }
    if (st.type==='coops') {
      const c = waterQuality?.coops?.[st.id]
      if (!c) return null
      return { wl:safeNum(c.water_level), temp:safeNum(c.water_temperature), sal:safeNum(c.salinity) }
    }
    if (st.type==='ndbc') {
      const b = waterQuality?.buoy
      return b ? { temp:safeNum(b.WTMP), wspd:safeNum(b.WSPD) } : null
    }
    if (st.type==='nerr') {
      const n = nerrs?.waterQuality?.latest
      return n ? { do2:safeNum(n.DO_mgl?.value), temp:safeNum(n.Temp?.value), sal:safeNum(n.Sal?.value) } : null
    }
    return null
  }, [waterQuality, nerrs])

  useEffect(() => {
    if (!mapRef.current || leafMap.current) return
    const map = L.map(mapRef.current, { center:[30.45,-87.9], zoom:9, zoomControl:true })
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:18, attribution:'Esri' }).addTo(map)
    leafMap.current = map
    setReady(true)
    return () => { map.remove(); leafMap.current = null }
  }, [])

  useEffect(() => {
    const map = leafMap.current
    if (!map) return
    if (gibsLayer.current) { map.removeLayer(gibsLayer.current); gibsLayer.current = null }
    if (activeGibs === 'none' || !cfg?.url) return
    const url = cfg.url.replace('{date}', fmtDate(daysBack))
    gibsLayer.current = L.tileLayer(url, { opacity, maxNativeZoom: 9, maxZoom: 18, attribution: 'NASA GIBS' }).addTo(map)
  }, [activeGibs, daysBack, opacity, cfg])

  useEffect(() => {
    const map = leafMap.current
    if (!map || !ready) return
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    STATIONS.forEach(st => {
      const data = getData(st)
      const color = st.type==='coops' ? '#3b82f6' : st.type==='ndbc' ? '#f59e0b' : st.type==='nerr' ? '#7c3aed' : doColor(data?.do2)
      const icon = L.divIcon({
        className: '', iconSize: [14, 14],
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);"></div>`
      })
      const marker = L.marker([st.lat, st.lon], { icon }).addTo(map)
      const popupDiv = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = st.short
      popupDiv.appendChild(title)
      if (data?.do2 != null) { const p = document.createElement('div'); p.textContent = `DO₂: ${data.do2.toFixed(1)} mg/L`; popupDiv.appendChild(p) }
      if (data?.temp != null) { const p = document.createElement('div'); p.textContent = `Temp: ${data.temp.toFixed(1)}°C`; popupDiv.appendChild(p) }
      if (data?.sal != null) { const p = document.createElement('div'); p.textContent = `Salinity: ${data.sal.toFixed(1)} ppt`; popupDiv.appendChild(p) }
      if (data?.wl != null) { const p = document.createElement('div'); p.textContent = `Water Level: ${data.wl.toFixed(2)} ft`; popupDiv.appendChild(p) }
      marker.bindPopup(popupDiv)
      if (showLabels) {
        const label = L.tooltip({ permanent: true, direction: 'right', offset: [8, 0], className: 'leaflet-label-tw' })
        label.setContent(st.short)
        marker.bindTooltip(label)
      }
      markersRef.current.push(marker)
    })
  }, [ready, waterQuality, nerrs, showLabels, getData])

  useEffect(() => {
    const map = leafMap.current
    if (!map || !ready) return
    overlayLayersRef.current.forEach(l => map.removeLayer(l))
    overlayLayersRef.current = []

    if (liveOverlays.currents && hfradar?.available) {
      const speed = hfradar.avgSpeed_ms || 0.1
      const dir = (hfradar.direction_deg ?? hfradar.avgDirection_deg ?? 0) * Math.PI / 180
      const pts = [[30.45,-87.9],[30.35,-87.85],[30.55,-87.95],[30.4,-88.0],[30.5,-87.8]]
      pts.forEach(([lat,lon]) => {
        const endLat = lat + Math.cos(dir)*0.03*speed
        const endLon = lon + Math.sin(dir)*0.03*speed
        const arrow = L.polyline([[lat,lon],[endLat,endLon]], {color:'#3b82f6',weight:2,opacity:0.8})
        const head = L.circleMarker([endLat,endLon], {radius:3,color:'#3b82f6',fillColor:'#3b82f6',fillOpacity:1})
        arrow.addTo(map); head.addTo(map)
        overlayLayersRef.current.push(arrow, head)
      })
    }

    if (liveOverlays.wind) {
      const windSources = []
      if (weather?.current) windSources.push({lat:30.69,lon:-88.04,spd:safeNum(weather.current.wind_speed_mph)||0,dir:safeNum(weather.current.wind_direction)||0,c:'#10b981',label:'NWS'})
      const buoy = waterQuality?.buoy
      if (buoy) windSources.push({lat:30.065,lon:-87.555,spd:safeNum(buoy.WSPD)||0,dir:safeNum(buoy.WDIR)||0,c:'#f59e0b',label:'Buoy'})
      const nerrsM = nerrs?.meteorological?.latest
      if (nerrsM?.WSpd?.value) windSources.push({lat:30.4167,lon:-87.825,spd:parseFloat(nerrsM.WSpd.value),dir:parseFloat(nerrsM.Wdir?.value||0),c:'#7c3aed',label:'NERR'})
      windSources.forEach(w => {
        const rad = w.dir * Math.PI / 180
        const len = Math.min(w.spd * 0.004, 0.08)
        const endLat = w.lat + Math.cos(rad) * len
        const endLon = w.lon + Math.sin(rad) * len
        const arrow = L.polyline([[w.lat,w.lon],[endLat,endLon]], {color:w.c,weight:3,opacity:0.9})
        const tip = L.circleMarker([endLat,endLon], {radius:4,color:w.c,fillColor:w.c,fillOpacity:1})
        const lbl = L.tooltip({permanent:true,direction:'right',offset:[6,0],className:'leaflet-label-tw'})
        lbl.setContent(`${w.label} ${w.spd.toFixed(0)}`)
        tip.bindTooltip(lbl)
        arrow.addTo(map); tip.addTo(map)
        overlayLayersRef.current.push(arrow, tip)
      })
    }

    if (liveOverlays.waves && waterQuality?.buoy) {
      const b = waterQuality.buoy
      const wvht = safeNum(b.WVHT) || 0
      const mwd = safeNum(b.MWD) || 0
      const ring = L.circleMarker([30.065,-87.555], {radius:8+wvht*6,color:'#8b5cf6',fillColor:'#8b5cf6',fillOpacity:0.2,weight:2})
      ring.bindTooltip(`Waves: ${wvht.toFixed(1)}m @ ${(safeNum(b.DPD)||0).toFixed(0)}s`, {direction:'top'})
      ring.addTo(map)
      overlayLayersRef.current.push(ring)
      const rad = mwd * Math.PI / 180
      const endLat = 30.065 + Math.cos(rad)*0.06
      const endLon = -87.555 + Math.sin(rad)*0.06
      const dirLine = L.polyline([[30.065,-87.555],[endLat,endLon]], {color:'#8b5cf6',weight:2,dashArray:'5,5'})
      dirLine.addTo(map)
      overlayLayersRef.current.push(dirLine)
    }

    if (liveOverlays.solar) {
      const uv = safeNum(landStatus?.openMeteo?.current?.uv_index)
      if (uv != null) {
        const uvColor = uv > 8 ? '#dc2626' : uv > 5 ? '#f59e0b' : '#10b981'
        const uvRing = L.circleMarker([30.45,-87.9], {radius:20,color:uvColor,fillColor:uvColor,fillOpacity:0.15,weight:2})
        uvRing.bindTooltip(`UV Index: ${uv.toFixed(1)}`, {permanent:true,direction:'top',className:'leaflet-label-tw'})
        uvRing.addTo(map)
        overlayLayersRef.current.push(uvRing)
      }
      const par = nerrs?.meteorological?.latest?.TotPAR?.value
      if (par != null) {
        const parRing = L.circleMarker([30.4167,-87.825], {radius:14,color:'#f59e0b',fillColor:'#f59e0b',fillOpacity:0.2,weight:2})
        parRing.bindTooltip(`PAR: ${parseFloat(par).toFixed(0)} mmol/m2`, {direction:'bottom'})
        parRing.addTo(map)
        overlayLayersRef.current.push(parRing)
      }
    }
  }, [ready, liveOverlays, hfradar, weather, waterQuality, nerrs, landStatus])

  const toggleOverlay = (id) => setLiveOverlays(prev => ({...prev, [id]: !prev[id]}))

  return (
    <div className="flex flex-col" style={{height:'100vh'}}>
      <div className="flex-shrink-0 px-4 py-2.5 bg-white border-b border-bay-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="font-bold text-sm text-bay-800" style={{fontFamily:'Syne,sans-serif'}}>Satellite Map</div>
            <div className="text-[9px] text-bay-300 tw-mono">Esri WorldImagery + NASA GIBS · 11 stations</div>
          </div>
          <div className="h-5 w-px bg-bay-100" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="tw-label">Overlay:</span>
            {GIBS.map(l=>(
              <button key={l.id} onClick={()=>setActiveGibs(l.id)}
                className="text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all"
                style={activeGibs===l.id?{background:l.color,color:'#fff',borderColor:l.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>
          {activeGibs!=='none' && (
            <>
              <div className="h-5 w-px bg-bay-100" />
              <div className="flex items-center gap-1">
                {[0,1,2,3].map(d=>(
                  <button key={d} onClick={()=>setDaysBack(d)}
                    className={clsx('tw-mono text-[9px] px-2 py-1 rounded border transition-colors',daysBack===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-400 border-bay-200')}>
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
          <div className="h-5 w-px bg-bay-100" />
          <div className="flex items-center gap-1">
            <span className="tw-label">Live:</span>
            {LIVE_OVERLAYS.map(lo=>(
              <button key={lo.id} onClick={()=>toggleOverlay(lo.id)}
                className="text-[10px] px-2 py-1 rounded-lg border font-medium transition-all"
                style={liveOverlays[lo.id]?{background:lo.color,color:'#fff',borderColor:lo.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
                {lo.icon} {lo.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setShowLabels(s=>!s)}
              className={clsx('text-[10px] px-2.5 py-1 rounded-lg border font-medium',showLabels?'bg-teal-50 text-teal-700 border-teal-200':'bg-white text-bay-400 border-bay-200')}>
              {showLabels?'◉ Labels':'○ Labels'}
            </button>
          </div>
        </div>
        {activeGibs!=='none' && cfg?.url && (
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-bay-50">
            <div className="w-2 h-2 rounded-full" style={{background:cfg.color}}/>
            <span className="text-[10px] text-bay-400">{cfg.label} · {fmtDate(daysBack)} · NASA GIBS free tiles</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <div ref={mapRef} style={{width:'100%',height:'100%'}}/>
          {!ready && <div className="absolute inset-0 flex items-center justify-center bg-bay-50"><Spinner size={32}/></div>}
          <div className="absolute bottom-4 left-4 z-[1000]" style={{background:'rgba(10,30,24,0.85)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 12px'}}>
            <div className="tw-mono text-[8px] text-teal-400 mb-2 tracking-widest">STATION LEGEND</div>
            {[{c:'#10b981',l:'DO₂ Good (>5 mg/L)'},{c:'#f59e0b',l:'DO₂ Low (3–5 mg/L)'},{c:'#dc2626',l:'DO₂ Critical (<3 mg/L)'},{c:'#3b82f6',l:'CO-OPS Tidal'},{c:'#7c3aed',l:'NERR Reserve'},{c:'#f59e0b',l:'NDBC Buoy (offshore)'}].map(i=>(
              <div key={i.l} className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:i.c,border:'2px solid rgba(255,255,255,0.7)'}}/>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontFamily:'JetBrains Mono,monospace'}}>{i.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-56 flex-shrink-0 overflow-y-auto bg-white border-l border-bay-100 p-3 space-y-2">
          <div className="tw-label">All Stations — Live</div>
          {STATIONS.map(st=>{
            const data=getData(st); const do2=data?.do2; const alert=do2!=null&&do2<4
            return (
              <div key={st.id}
                className={clsx('p-2 rounded-lg border cursor-pointer transition-all text-left',selected?.id===st.id?'border-teal-400 bg-teal-50':alert?'border-red-200 bg-red-50':'border-bay-100 hover:border-bay-200 bg-bay-50')}
                onClick={()=>{setSelected(st);if(leafMap.current)leafMap.current.setView([st.lat,st.lon],11,{animate:true})}}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:st.type==='coops'?'#3b82f6':st.type==='ndbc'?'#f59e0b':st.type==='nerr'?'#7c3aed':doColor(do2)}}/>
                  <div className="text-[11px] font-semibold text-bay-700 truncate">{st.short}</div>
                  <div className="tw-mono text-[8px] text-bay-300 ml-auto">{st.type}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {do2!=null&&<span className="tw-mono text-[10px] font-bold" style={{color:doColor(do2)}}>{do2.toFixed(1)} mg/L</span>}
                  {data?.temp!=null&&<span className="tw-mono text-[10px] text-bay-400">{data.temp.toFixed(1)}°C</span>}
                  {data?.flow!=null&&<span className="tw-mono text-[10px] text-bay-400">{(data.flow/1000).toFixed(0)}K</span>}
                  {data?.wl!=null&&<span className="tw-mono text-[10px] text-blue-600">{data.wl.toFixed(1)} ft</span>}
                  {data?.sal!=null&&<span className="tw-mono text-[10px] text-purple-600">{data.sal.toFixed(1)} ppt</span>}
                  {!data&&<span className="tw-mono text-[9px] text-bay-300">No data</span>}
                </div>
              </div>
            )
          })}

          {waterQuality?.buoy && (
            <div className="mt-3 pt-2 border-t border-bay-100">
              <div className="tw-label text-purple-600 mb-1">≋ Waves — Buoy 42012</div>
              <div className="space-y-0.5">
                {safeNum(waterQuality.buoy.WVHT)!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">Height:</span> <span className="font-bold text-purple-700">{safeNum(waterQuality.buoy.WVHT).toFixed(1)}m</span></div>}
                {safeNum(waterQuality.buoy.DPD)!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">Period:</span> {safeNum(waterQuality.buoy.DPD).toFixed(0)}s</div>}
                {safeNum(waterQuality.buoy.MWD)!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">Direction:</span> {safeNum(waterQuality.buoy.MWD)}° {['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(safeNum(waterQuality.buoy.MWD)/22.5)%16]}</div>}
              </div>
            </div>
          )}

          {landStatus?.openMeteo?.current && (
            <div className="mt-2 pt-2 border-t border-bay-100">
              <div className="tw-label text-amber-600 mb-1">☀ Solar / UV</div>
              <div className="space-y-0.5">
                {safeNum(landStatus.openMeteo.current.uv_index)!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">UV Index:</span> <span className={clsx('font-bold',safeNum(landStatus.openMeteo.current.uv_index)>8?'text-red-600':safeNum(landStatus.openMeteo.current.uv_index)>5?'text-amber-600':'text-green-600')}>{safeNum(landStatus.openMeteo.current.uv_index).toFixed(1)}</span></div>}
                {safeNum(landStatus.openMeteo.current.solar_rad_wm2)!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">Solar:</span> {safeNum(landStatus.openMeteo.current.solar_rad_wm2).toFixed(0)} W/m²</div>}
                {nerrs?.meteorological?.latest?.TotPAR?.value!=null&&<div className="tw-mono text-[10px]"><span className="text-bay-400">PAR:</span> {parseFloat(nerrs.meteorological.latest.TotPAR.value).toFixed(0)} mmol/m²</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner } from '../components/Common/index.jsx'

function sn(v) {
  if (v == null) return null
  if (typeof v === 'number') return isNaN(v) ? null : v
  if (typeof v === 'object' && 'value' in v) return sn(v.value)
  const n = parseFloat(v); return isNaN(n) ? null : n
}
const fmt = (v, dp = 2) => v == null ? '—' : typeof v === 'number' ? v.toFixed(dp) : v
const fmtBig = v => v == null ? '—' : v.toLocaleString()

function compass(deg) {
  if (deg == null) return <span style={{color:'#9ca3af'}}>—</span>
  const rad = (deg - 90) * Math.PI / 180
  const x2 = 8 + 6 * Math.cos(rad), y2 = 8 + 6 * Math.sin(rad)
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontFamily:'monospace',fontSize:11}}>
      <svg width={16} height={16} viewBox="0 0 16 16" style={{flexShrink:0}}>
        <circle cx={8} cy={8} r={7} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.3}/>
        <line x1={8} y1={8} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        <circle cx={x2} cy={y2} r={1.5} fill="currentColor"/>
      </svg>
      {deg.toFixed(0)}°
    </span>
  )
}

function Key({ label, value, unit, color, alert, flag, dir, dp = 2, note }) {
  const bg = alert && value ? 'rgba(220,38,38,0.08)' : 'var(--color-background-secondary)'
  const border = alert && value ? '0.5px solid rgba(220,38,38,0.3)' : '0.5px solid var(--color-border-tertiary)'
  const col = color || (alert && value ? '#dc2626' : 'var(--color-text-primary)')

  let display
  if (flag != null) {
    display = (
      <span style={{fontSize:11,fontWeight:600,padding:'1px 7px',borderRadius:10,
        background: flag ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.12)',
        color: flag ? '#059669' : '#6b7280'}}>
        {flag ? 'YES' : 'NO'}
      </span>
    )
  } else if (dir) {
    display = compass(sn(value))
  } else {
    const v = sn(value)
    display = (
      <span style={{fontFamily:'monospace',fontSize:13,fontWeight:600,color:col}}>
        {v != null ? fmt(v, dp) : '—'}
        {unit && v != null && <span style={{fontSize:10,fontWeight:400,color:'var(--color-text-tertiary)',marginLeft:3}}>{unit}</span>}
      </span>
    )
  }

  return (
    <div style={{background:bg,border,borderRadius:8,padding:'8px 10px',minWidth:0}}>
      <div style={{fontSize:10,color:'var(--color-text-tertiary)',marginBottom:3,lineHeight:1.2}}>{label}</div>
      {display}
      {note && <div style={{fontSize:9,color:'var(--color-text-tertiary)',marginTop:2}}>{note}</div>}
    </div>
  )
}

function Section({ title, accent, children }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,paddingBottom:5,borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
        <div style={{width:3,height:14,borderRadius:2,background:accent,flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{title}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6}}>
        {children}
      </div>
    </div>
  )
}

function AlertBadge({ label, active, color = '#dc2626' }) {
  if (!active) return null
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,
      background:`${color}18`,border:`1px solid ${color}40`,marginRight:6,marginBottom:6}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:color,animation:'pulse 1.5s infinite'}}/>
      <span style={{fontSize:11,fontWeight:600,color,fontFamily:'monospace'}}>{label}</span>
    </div>
  )
}

const TABS = [
  {id:'water',   label:'Water Quality', color:'#0ea5e9'},
  {id:'goes',    label:'GOES-19',       color:'#f97316'},
  {id:'atmos',   label:'Atmospheric',   color:'#fbbf24'},
  {id:'model',   label:'Weather Model', color:'#a78bfa'},
  {id:'sat',     label:'Satellite',     color:'#22d3ee'},
  {id:'eco',     label:'Ecology',       color:'#4ade80'},
  {id:'air',     label:'Air Quality',   color:'#fb7185'},
  {id:'land',    label:'Land/Reg',      color:'#f59e0b'},
  {id:'ml',      label:'ML Internals',  color:'#94a3b8'},
]

export default function DataStream() {
  const {
    waterQuality, nerrs, weather, hfradar, landStatus,
    airplusStatus, ecologyStatus, satelliteStatus, oceanStatus, goesStatus, goesLatest,
    fetchAll, fetchNERRS, fetchHFRadar, fetchGoesLatest, fetchLandStatus,
    fetchAirPlusStatus, fetchEcologyStatus, fetchSatelliteStatus, fetchOceanStatus,
    lastUpdated,
  } = useStore()

  const [tab, setTab] = useState('water')

  useEffect(() => {
    fetchNERRS(); fetchHFRadar(); fetchGoesLatest(); fetchLandStatus()
    fetchAirPlusStatus(); fetchEcologyStatus(); fetchSatelliteStatus(); fetchOceanStatus()
  }, [])

  const usgs   = waterQuality?.usgs || []
  const coops  = waterQuality?.coops || {}
  const buoy   = waterQuality?.buoy
  const wq     = nerrs?.waterQuality?.latest || {}
  const met    = nerrs?.meteorological?.latest || {}
  const hf     = hfradar || {}
  const om     = landStatus?.openMeteo || {}
  const omNow  = om.current || {}

  const stMap = {}
  usgs.forEach(s => { stMap[s.siteNo] = s.readings || {} })
  const r_dog  = stMap['02479000'] || {}
  const r_i65  = stMap['02469761'] || {}
  const r_fowl = stMap['02479155'] || {}
  const dauphin = coops['8735180'] || {}

  const do2Vals = usgs.map(s => sn(s.readings?.do_mg_l)).filter(v => v != null)
  const tmpVals = usgs.map(s => sn(s.readings?.water_temp_c)).filter(v => v != null)
  const flwVals = usgs.map(s => sn(s.readings?.streamflow_cfs)).filter(v => v != null)
  const turbVals= usgs.map(s => sn(s.readings?.turbidity_ntu)).filter(v => v != null)
  const mean = a => a.length ? a.reduce((s,v)=>s+v,0)/a.length : null
  const min  = a => a.length ? Math.min(...a) : null
  const max  = a => a.length ? Math.max(...a) : null

  const gl = goesLatest || {}

  const totalKeys = 141
  const liveKeys = [
    ...do2Vals, sn(wq.Temp?.value), sn(wq.Sal?.value), sn(met.WSpd?.value),
    sn(gl.sst_gradient), sn(gl.bloom_index), sn(buoy?.WVHT),
    sn(omNow.solar_rad_wm2), sn(omNow.uv_index),
  ].filter(v => v != null).length

  return (
    <div style={{padding:'24px',maxWidth:1400}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <PageHeader
        icon="⊕"
        title="Data Stream"
        subtitle={`All ${totalKeys} ML feature vector keys — live values from 15 sources`}
        badge={lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading…'}
        actions={
          <button onClick={() => { fetchAll(); fetchGoesLatest(); fetchNERRS(); fetchHFRadar() }}
            style={{fontSize:12,padding:'6px 14px',borderRadius:8,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',cursor:'pointer',color:'var(--color-text-primary)'}}>
            ↺ Refresh all
          </button>
        }
      />

      {/* Active alerts strip */}
      <div style={{marginBottom:16,padding:'10px 14px',background:'var(--color-background-secondary)',borderRadius:10,border:'0.5px solid var(--color-border-tertiary)'}}>
        <div style={{fontSize:10,fontWeight:500,color:'var(--color-text-tertiary)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Active alerts</div>
        <AlertBadge label="GOES Stratification ≥3.5°C" active={sn(gl.sst_gradient) >= 3.5} color="#dc2626"/>
        <AlertBadge label="GOES Bloom Detected"       active={sn(gl.bloom_index) >= 0.12}  color="#f97316"/>
        <AlertBadge label="GOES Nutrient Pulse ≥5mm"  active={sn(gl.qpe_6h) >= 5}          color="#eab308"/>
        <AlertBadge label="DO₂ Critical"               active={min(do2Vals) < 3}             color="#dc2626"/>
        <AlertBadge label="DO₂ Low"                    active={min(do2Vals) >= 3 && min(do2Vals) < 5} color="#f59e0b"/>
        <AlertBadge label="UV Very High"               active={sn(omNow.uv_index) >= 8}     color="#7c3aed"/>
        {[...new Array(7)].every((_, i) => ![ sn(gl.sst_gradient) >= 3.5, sn(gl.bloom_index) >= 0.12, sn(gl.qpe_6h) >= 5, min(do2Vals) < 3, min(do2Vals) >= 3 && min(do2Vals) < 5, sn(omNow.uv_index) >= 8 ][i]) &&
          <span style={{fontSize:11,color:'var(--color-text-tertiary)'}}>No active alerts</span>
        }
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:4,marginBottom:20,flexWrap:'wrap',borderBottom:'0.5px solid var(--color-border-tertiary)',paddingBottom:0}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{fontSize:12,padding:'7px 14px',cursor:'pointer',border:'none',background:'none',
              borderBottom: tab===t.id ? `2px solid ${t.color}` : '2px solid transparent',
              color: tab===t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: tab===t.id ? 500 : 400, marginBottom:-1}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WATER QUALITY ─────────────────────────────────────────────────── */}
      {tab === 'water' && <>
        <Section title="USGS NWIS — aggregate (6 stations)" accent="#0ea5e9">
          <Key label="min_do2"          value={min(do2Vals)} unit="mg/L" color={min(do2Vals)<3?'#dc2626':min(do2Vals)<5?'#f59e0b':'#10b981'} alert={min(do2Vals)<5}/>
          <Key label="avg_do2"          value={mean(do2Vals)} unit="mg/L"/>
          <Key label="max_do2"          value={max(do2Vals)} unit="mg/L"/>
          <Key label="std_do2"          value={do2Vals.length>1?Math.sqrt(do2Vals.map(v=>(v-mean(do2Vals))**2).reduce((a,b)=>a+b,0)/do2Vals.length):null} unit="mg/L" note="Spatial variance"/>
          <Key label="avg_temp"         value={mean(tmpVals)} unit="°C"/>
          <Key label="max_temp"         value={max(tmpVals)} unit="°C"/>
          <Key label="total_flow_kcfs"  value={flwVals.reduce((a,b)=>a+b,0)/1000} unit="K cfs" dp={1}/>
          <Key label="avg_turb"         value={mean(turbVals)} unit="NTU"/>
          <Key label="max_turb"         value={max(turbVals)} unit="NTU"/>
          <Key label="station_count"    value={usgs.length} unit="" dp={0}/>
          <Key label="hypoxic_stations" value={do2Vals.filter(v=>v<3).length} unit="" dp={0} alert color="#dc2626"/>
          <Key label="low_do2_stations" value={do2Vals.filter(v=>v<5).length} unit="" dp={0} alert={do2Vals.filter(v=>v<5).length>0}/>
        </Section>

        <Section title="USGS — Dog River (02479000)" accent="#0ea5e9">
          <Key label="do2_dogriver"        value={sn(r_dog.do_mg_l)}           unit="mg/L" color={sn(r_dog.do_mg_l)<3?'#dc2626':sn(r_dog.do_mg_l)<5?'#f59e0b':'#10b981'}/>
          <Key label="turb_dogriver"       value={sn(r_dog.turbidity_ntu)}      unit="NTU"/>
          <Key label="gage_height_dogriver"value={sn(r_dog.gage_height_ft)}     unit="ft" note="Flood stage proxy"/>
          <Key label="ortho_p_dogriver"    value={sn(r_dog.orthophosphate_mg_l)}unit="mg/L" dp={3} note="Direct P loading" color="#f97316"/>
          <Key label="upstream_do2_dogriver"    value={sn(r_dog.do_mg_l)}       unit="mg/L"/>
          <Key label="upstream_flow_dogriver"   value={sn(r_dog.streamflow_cfs)/1000} unit="K cfs" dp={1}/>
          <Key label="upstream_turb_dogriver"   value={sn(r_dog.turbidity_ntu)}  unit="NTU"/>
          <Key label="lag_dogriver_weeksbay_h"  value={hf.avgSpeed_ms ? Math.round(18/(hf.avgSpeed_ms*3.6)*10)/10 : null} unit="h" note="Transport lag"/>
        </Section>

        <Section title="USGS — Mobile R. I-65 (02469761)" accent="#0ea5e9">
          <Key label="do2_mobilei65"        value={sn(r_i65.do_mg_l)}           unit="mg/L"/>
          <Key label="flow_mobilei65"       value={sn(r_i65.streamflow_cfs)/1000} unit="K cfs" dp={1}/>
          <Key label="gage_height_mobilei65"value={sn(r_i65.gage_height_ft)}     unit="ft"/>
          <Key label="total_n_mobilei65"    value={sn(r_i65.total_nitrogen_mg_l)}unit="mg/L" dp={3} note="Direct N loading" color="#f97316"/>
        </Section>

        <Section title="USGS — Fowl River (02479155)" accent="#0ea5e9">
          <Key label="do2_fowlriver" value={sn(r_fowl.do_mg_l)} unit="mg/L"/>
        </Section>

        <Section title="NERRS Weeks Bay — water quality (wekaswq)" accent="#22c55e">
          <Key label="wbDo2"   value={sn(wq.DO_mgl?.value)}    unit="mg/L" color={sn(wq.DO_mgl?.value)<3?'#dc2626':sn(wq.DO_mgl?.value)<5?'#f59e0b':'#10b981'}/>
          <Key label="wbDOPct" value={sn(wq.DO_pct?.value)}    unit="%" note="% saturation"/>
          <Key label="wbTemp"  value={sn(wq.Temp?.value)}      unit="°C"/>
          <Key label="wbSal"   value={sn(wq.Sal?.value)}       unit="ppt"/>
          <Key label="wbTurb"  value={sn(wq.Turb?.value)}      unit="NTU"/>
          <Key label="wbChlFl" value={sn(wq.ChlFluor?.value)}  unit="µg/L" note="Bloom indicator" color="#16a34a"/>
          <Key label="wbCond"  value={sn(wq.SpCond?.value)}    unit="mS/cm"/>
          <Key label="wbPH"    value={sn(wq.pH?.value)}        unit=""/>
          <Key label="wbDepth" value={sn(wq.Depth?.value ?? wq.Level?.value)} unit="m"/>
        </Section>

        <Section title="CO-OPS — Dauphin Island (8735180)" accent="#3b82f6">
          <Key label="waterLevel_dauphinIs" value={sn(dauphin.water_level?.value)}      unit="ft"/>
          <Key label="salinity_dauphinIs"   value={sn(dauphin.salinity?.value)}          unit="ppt"/>
          <Key label="waterTemp_dauphinIs"  value={sn(dauphin.water_temperature?.value)} unit="°C"/>
          <Key label="coops_wind_speed"     value={sn(dauphin.wind?.value)}              unit="kts" note="CO-OPS wind product"/>
          <Key label="coops_air_pressure_mb"value={sn(dauphin.air_pressure?.value)}      unit="mb"/>
          <Key label="coops_air_temp_c"     value={sn(dauphin.air_temperature?.value)}   unit="°C"/>
        </Section>
      </>}

      {/* ── GOES-19 ────────────────────────────────────────────────────────── */}
      {tab === 'goes' && <>
        <Section title="GOES-19 — SST (push via ground station)" accent="#f97316">
          <Key label="goes_sst_mean"     value={sn(gl.sst_mean)}     unit="°C" note="Bay mean SST"/>
          <Key label="goes_sst_gradient" value={sn(gl.sst_gradient)} unit="°C" alert={sn(gl.sst_gradient)>=3.5} color={sn(gl.sst_gradient)>=3.5?'#dc2626':'#f97316'} note="≥3.5°C = stratification alert"/>
        </Section>
        <Section title="GOES-19 — QPE rainfall" accent="#f97316">
          <Key label="goes_qpe_rainfall" value={sn(gl.qpe_rainfall)} unit="mm/hr"/>
          <Key label="goes_qpe_6h"       value={sn(gl.qpe_6h)}       unit="mm" alert={sn(gl.qpe_6h)>=5} note="≥5mm = nutrient pulse"/>
          <Key label="goes_qpe_24h"      value={sn(gl.qpe_24h)}      unit="mm"/>
        </Section>
        <Section title="GOES-19 — Cloud mask" accent="#f97316">
          <Key label="goes_cloud_pct"  value={sn(gl.cloud_coverage)} unit="%" note="% covered"/>
          <Key label="goes_erddap_active" flag={goesStatus?.status?.available ?? false} label="goes_erddap_active"/>
        </Section>
        <Section title="GOES-19 — RGB bloom detection" accent="#f97316">
          <Key label="goes_bloom_index"   value={sn(gl.bloom_index)}   unit="" dp={3} alert={sn(gl.bloom_index)>=0.12} color={sn(gl.bloom_index)>=0.2?'#dc2626':sn(gl.bloom_index)>=0.12?'#f97316':'#10b981'} note="NIR/red — ≥0.12 = surface bloom"/>
          <Key label="goes_turbidity_idx" value={sn(gl.turbidity_idx)} unit="" dp={3} note="B01 reflectance anomaly"/>
          <Key label="goes_bloom_alert"   flag={sn(gl.bloom_index)>=0.12}/>
        </Section>
        <Section title="GOES-19 — GLM lightning" accent="#f97316">
          <Key label="goes_glm_flashes" value={sn(gl.glm_flashes)} unit="flashes/5min" dp={0} note="Convective mixing"/>
          <Key label="goes_glm_active"  flag={sn(gl.glm_active)===1}/>
        </Section>
        <Section title="GOES-19 — AMV surface winds" accent="#f97316">
          <Key label="goes_amv_speed" value={sn(gl.amv_wind_speed)} unit="m/s"/>
          <Key label="goes_amv_dir"   value={sn(gl.amv_wind_dir)} dir label="goes_amv_dir"/>
        </Section>
        <Section title="GOES-19 — Derived alerts" accent="#dc2626">
          <Key label="goes_stratification_alert" flag={sn(gl.sst_gradient)>=3.5}   note="SST gradient ≥3.5°C"/>
          <Key label="goes_nutrient_pulse_alert"  flag={sn(gl.qpe_6h)>=5}            note="QPE 6h ≥5mm"/>
        </Section>
      </>}

      {/* ── ATMOSPHERIC ───────────────────────────────────────────────────── */}
      {tab === 'atmos' && <>
        <Section title="NERRS met station (wekmet) — Weeks Bay" accent="#fbbf24">
          <Key label="wbWSpd"    value={sn(met.WSpd?.value)}    unit="m/s" note="Wind speed at bay"/>
          <Key label="wbMaxWSpd" value={sn(met.MaxWSpd?.value)} unit="m/s" note="Gust"/>
          <Key label="wbWdir"    value={sn(met.Wdir?.value)} dir label="wbWdir"/>
          <Key label="wbATemp"   value={sn(met.ATemp?.value)}   unit="°C"/>
          <Key label="wbBP"      value={sn(met.BP?.value)}      unit="mb"/>
          <Key label="wbPAR"     value={sn(met.TotPAR?.value)}  unit="mmol/m²" note="Bloom growth driver" color="#f97316"/>
          <Key label="wbPrec"    value={sn(met.TotPrec?.value)} unit="mm"/>
          <Key label="wbRH"      value={sn(met.RH?.value)}      unit="%"/>
        </Section>
        <Section title="NDBC Buoy 42012 — offshore Gulf" accent="#f59e0b">
          <Key label="buoy_water_temp_c"      value={sn(buoy?.WTMP)} unit="°C"/>
          <Key label="buoy_wind_speed_ms"     value={sn(buoy?.WSPD)} unit="m/s"/>
          <Key label="buoy_wind_dir_deg"      value={sn(buoy?.WDIR)} dir label="buoy_wind_dir_deg"/>
          <Key label="buoy_wind_gust_ms"      value={sn(buoy?.GST)}  unit="m/s" note="Gust" color="#f97316"/>
          <Key label="buoy_air_temp_c"        value={sn(buoy?.ATMP)} unit="°C"/>
          <Key label="buoy_pressure_mb"       value={sn(buoy?.PRES)} unit="mb"/>
          <Key label="buoy_wave_height_m"     value={sn(buoy?.WVHT)} unit="m"  color="#8b5cf6"/>
          <Key label="buoy_dom_wave_period_s" value={sn(buoy?.DPD)}  unit="s"  note="Dominant period" color="#8b5cf6"/>
          <Key label="buoy_avg_wave_period_s" value={sn(buoy?.APD)}  unit="s"/>
          <Key label="buoy_mean_wave_dir"     value={sn(buoy?.MWD)} dir label="buoy_mean_wave_dir" note="Waves travel toward"/>
          <Key label="buoy_dewpoint_c"        value={sn(buoy?.DEWP)} unit="°C"/>
          <Key label="buoy_available"         flag={buoy != null}/>
        </Section>
        <Section title="NOAA NWS — Mobile surface observations" accent="#fbbf24">
          <Key label="nws_wind_speed_mph" value={sn(weather?.current?.wind_speed_mph)} unit="mph"/>
          <Key label="nws_wind_speed_ms"  value={sn(weather?.current?.wind_speed_ms)}  unit="m/s"/>
          <Key label="nws_wind_gust_mph"  value={sn(weather?.current?.wind_gust_mph)}  unit="mph" color="#f97316" note="Gust"/>
          <Key label="nws_wind_gust_ms"   value={sn(weather?.current?.wind_gust_ms)}   unit="m/s"/>
          <Key label="nws_wind_dir_deg"   value={sn(weather?.current?.wind_direction)} dir label="nws_wind_dir_deg"/>
          <Key label="nws_temp_f"         value={sn(weather?.current?.temp_f)}         unit="°F"/>
          <Key label="nws_temp_c"         value={sn(weather?.current?.temp_c)}         unit="°C"/>
          <Key label="nws_humidity_pct"   value={sn(weather?.current?.humidity)}       unit="%"/>
          <Key label="nws_dewpoint_c"     value={sn(weather?.current?.dewpoint_c)}     unit="°C"/>
          <Key label="nws_pressure_mb"    value={sn(weather?.current?.pressure_mb)}    unit="mb"/>
          <Key label="nws_visibility_m"   value={sn(weather?.current?.visibility_m)}   unit="m" dp={0}/>
          <Key label="nws_available"      flag={weather?.current?.wind_speed_mph != null}/>
        </Section>
        <Section title="HF Radar — surface currents" accent="#0ea5e9">
          <Key label="currentSpeed_ms" value={sn(hf.avgSpeed_ms)}         unit="m/s"/>
          <Key label="currentDir_deg"  value={sn(hf.direction_deg)} dir   label="currentDir_deg"/>
          <Key label="bloom14h_km"     value={sn(hf.bloom_transport?.distance_14h_km)} unit="km" note="Bloom drift 14h" color="#f97316"/>
          <Key label="bloom24h_km"     value={sn(hf.bloom_transport?.distance_24h_km)} unit="km" note="Bloom drift 24h"/>
        </Section>
        <Section title="AirNow AQI" accent="#fb7185">
          <Key label="aqi" value={sn(useStore.getState().aqi?.readings?.[0]?.aqi)} unit="" dp={0} color={sn(useStore.getState().aqi?.readings?.[0]?.aqi)>100?'#dc2626':sn(useStore.getState().aqi?.readings?.[0]?.aqi)>50?'#f59e0b':'#10b981'}/>
        </Section>
      </>}

      {/* ── WEATHER MODEL ─────────────────────────────────────────────────── */}
      {tab === 'model' && <>
        <Section title="Open-Meteo — current conditions" accent="#a78bfa">
          <Key label="precip_current_mm" value={sn(omNow.precip_mm)}      unit="mm/hr"/>
          <Key label="wind_ms_openmeteo" value={sn(omNow.wind_ms)}        unit="m/s"/>
          <Key label="cape_jkg"          value={sn(omNow.cape)}           unit="J/kg" alert={sn(omNow.cape)>1000} color={sn(omNow.cape)>1500?'#dc2626':sn(omNow.cape)>500?'#f59e0b':'#10b981'} note="≥500=storm risk"/>
          <Key label="solar_rad_wm2"     value={sn(omNow.solar_rad_wm2)}  unit="W/m²" color="#f97316" note="Direct bloom driver"/>
          <Key label="uv_index"          value={sn(omNow.uv_index)}       unit="" dp={1} color={sn(omNow.uv_index)>=8?'#7c3aed':sn(omNow.uv_index)>=6?'#dc2626':sn(omNow.uv_index)>=3?'#f59e0b':'#10b981'} note="Algae growth multiplier"/>
          <Key label="lifted_index"      value={sn(omNow.lifted_index)}   unit="" dp={1} color={sn(omNow.lifted_index)<-2?'#dc2626':'#10b981'} note="Negative=unstable"/>
          <Key label="soil_moisture"     value={sn(omNow.soil_moisture)}  unit="m³/m³" dp={3} note="Watershed runoff proxy"/>
          <Key label="cin"               value={sn(omNow.cin)}            unit="J/kg" note="Convective inhibition"/>
          <Key label="blh"               value={sn(omNow.blh)}            unit="m" dp={0} note="Boundary layer height"/>
        </Section>
        <Section title="Open-Meteo — 7-day outlook" accent="#a78bfa">
          <Key label="precip_7day_sum_mm"  value={om.dailyForecast?.slice(0,7).reduce((s,d)=>s+(sn(d.precip_sum_mm)??0),0)} unit="mm" dp={1}/>
          <Key label="max_precip_prob_7d"  value={om.dailyForecast ? Math.max(...om.dailyForecast.slice(0,7).map(d=>sn(d.precipProb)??0)) : null} unit="%"/>
          <Key label="uv_max_7d"           value={om.dailyForecast ? Math.max(...om.dailyForecast.slice(0,7).map(d=>sn(d.uv_max)??0)) : null} unit="" dp={1}/>
          <Key label="sunshine_hrs_today"  value={sn(om.dailyForecast?.[0]?.sunshine_hrs)} unit="h" dp={1}/>
          <Key label="solar_sum_today"     value={sn(om.dailyForecast?.[0]?.solar_sum_wm2)} unit="MJ/m²" dp={1}/>
        </Section>
        <Section title="AHPS flood stage" accent="#3b82f6">
          <Key label="ahps_flood_stage_ft" value={sn(landStatus?.ahps?.stage)} unit="ft"/>
          <Key label="ahps_flood_active"   flag={landStatus?.ahps?.available ?? false}/>
        </Section>
      </>}

      {/* ── SATELLITE ─────────────────────────────────────────────────────── */}
      {tab === 'sat' && <>
        <Section title="Satellite granule availability (NASA CMR + Copernicus)" accent="#22d3ee">
          <Key label="modis_granules"      value={sn(satelliteStatus?.modis?.granules)}         unit="granules" dp={0} note="MODIS Aqua CHL/SST"/>
          <Key label="viirs_granules"      value={sn(satelliteStatus?.viirs?.granules)}         unit="granules" dp={0}/>
          <Key label="hls_granules"        value={(satelliteStatus?.hls?.HLSL30?.granules||0)+(satelliteStatus?.hls?.HLSS30?.granules||0)} unit="granules" dp={0} note="HLS L30+S30"/>
          <Key label="landsat_granules"    value={sn(satelliteStatus?.landsat?.granules)}       unit="granules" dp={0}/>
          <Key label="sentinel2_granules"  value={sn(satelliteStatus?.sentinel2?.granules)}     unit="granules" dp={0}/>
          <Key label="sentinel2_cloud_pct" value={sn(satelliteStatus?.sentinel2?.latest?.cloudPct)} unit="%" note="Cloud cover"/>
          <Key label="pace_active"         flag={satelliteStatus?.pace?.configured ?? false} note="NASA PACE OCI"/>
          <Key label="goes_erddap_active"  flag={goesStatus?.status?.available ?? false} note="GOES-19 ERDDAP SST"/>
          <Key label="cmems_available"     flag={oceanStatus?.cmems?.available ?? false}/>
          <Key label="hycom_available"     flag={oceanStatus?.hycom?.available ?? false}/>
          <Key label="coastwatch_chl_rows" value={sn(oceanStatus?.coastwatch?.data?.table?.rows?.length)} unit="rows" dp={0} note="CoastWatch CHL data"/>
        </Section>
      </>}

      {/* ── ECOLOGY ───────────────────────────────────────────────────────── */}
      {tab === 'eco' && <>
        <Section title="Biodiversity observations — Mobile Bay region" accent="#4ade80">
          <Key label="inaturalist_obs_7d"   value={sn(ecologyStatus?.iNaturalist?.totalCount)} unit="obs"    dp={0} color="#16a34a" note="iNaturalist 7-day"/>
          <Key label="gbif_occurrences_90d" value={sn(ecologyStatus?.gbif?.totalCount)}        unit="occ"    dp={0} note="GBIF 90-day"/>
          <Key label="ebird_obs_7d"         value={sn(ecologyStatus?.eBird?.mobileBayObs ?? ecologyStatus?.eBird?.totalAlabamaObs)} unit="obs" dp={0} note="eBird 7-day"/>
          <Key label="ameriflux_active"     flag={ecologyStatus?.ameriflux?.available ?? false} note="CO₂/CH₄ flux tower"/>
        </Section>
      </>}

      {/* ── AIR QUALITY ───────────────────────────────────────────────────── */}
      {tab === 'air' && <>
        <Section title="Multi-source PM2.5 — Mobile Bay airshed" accent="#fb7185">
          <Key label="openaq_pm25"    value={sn(airplusStatus?.openAQ?.avgPM25)}    unit="µg/m³" dp={1} color={sn(airplusStatus?.openAQ?.avgPM25)>35?'#dc2626':'#10b981'} note="OpenAQ network avg"/>
          <Key label="purpleair_pm25" value={sn(airplusStatus?.purpleAir?.avgPM25)} unit="µg/m³" dp={1} color={sn(airplusStatus?.purpleAir?.avgPM25)>35?'#dc2626':'#10b981'} note="PurpleAir sensors"/>
          <Key label="epa_aqs_pm25"   value={sn(airplusStatus?.epaAQS?.avgValue)}   unit="µg/m³" dp={1} color={sn(airplusStatus?.epaAQS?.avgValue)>35?'#dc2626':'#10b981'} note="EPA AQS official"/>
          <Key label="air_quality_alert" flag={(sn(airplusStatus?.openAQ?.avgPM25)??0)>35||(sn(airplusStatus?.purpleAir?.avgPM25)??0)>35} note="PM2.5 > 35 µg/m³"/>
        </Section>
      </>}

      {/* ── LAND / REGULATORY ─────────────────────────────────────────────── */}
      {tab === 'land' && <>
        <Section title="Regulatory & land cover" accent="#f59e0b">
          <Key label="fema_flood_zone"     flag={landStatus?.fema?.floodZone != null} note="Zone designation available"/>
          <Key label="nlcd_impervious_pct" value={sn(landStatus?.nlcd?.imperviousPct)} unit="%" note="Impervious surface"/>
          <Key label="ncei_data_available" flag={landStatus?.ncei?.available ?? false} note="NOAA NCEI climate normals"/>
        </Section>
      </>}

      {/* ── ML INTERNALS ──────────────────────────────────────────────────── */}
      {tab === 'ml' && <>
        <Section title="Temporal encodings — ML feature engineering" accent="#94a3b8">
          <Key label="hour_of_day" value={new Date().getHours()} unit="h"  dp={0}/>
          <Key label="day_of_year" value={Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000)} unit="doy" dp={0}/>
          <Key label="month"       value={new Date().getMonth()+1} unit="" dp={0}/>
          <Key label="is_summer"   flag={[5,6,7,8,9].includes(new Date().getMonth()+1)} note="May–Sep"/>
          <Key label="is_night"    flag={new Date().getHours()<6||new Date().getHours()>=20} note="<6h or ≥20h UTC"/>
          <Key label="hour_sin"    value={Math.sin(2*Math.PI*new Date().getHours()/24)} unit="" dp={4} note="Cyclic encoding"/>
          <Key label="hour_cos"    value={Math.cos(2*Math.PI*new Date().getHours()/24)} unit="" dp={4}/>
          <Key label="doy_sin"     value={Math.sin(2*Math.PI*Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000)/365)} unit="" dp={4}/>
          <Key label="doy_cos"     value={Math.cos(2*Math.PI*Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0))/86400000)/365)} unit="" dp={4}/>
        </Section>
        <Section title="ML state" accent="#94a3b8">
          <Key label="hab_prob" value={useStore.getState().habAssessment?.hab?.probability} unit="%" dp={0} color={useStore.getState().habAssessment?.hab?.probability>=65?'#dc2626':'#10b981'} note="HAB Oracle current output"/>
        </Section>
      </>}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, RiskBadge } from '../components/Common/index.jsx'
import { AreaChart, Area, LineChart, Line, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import clsx from 'clsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

function safeNum(v) { if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; if(typeof v==='object'&&'value'in v)return safeNum(v.value); const n=parseFloat(v); return isNaN(n)?null:n }
function doColor(v) { return v==null?'#4a7060':v<3?'#dc2626':v<5?'#f59e0b':'#10b981' }
function fmtTime(ts) { try{return new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}catch{return ts} }
function fmtDate(ts) { try{return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'})}catch{return ts} }

const PARAMS = {
  do_mg_l:           { label:'DO₂',         unit:'mg/L', color:'#10b981', critLow:3, warnLow:5  },
  water_temp_c:      { label:'Temperature',  unit:'°C',   color:'#f59e0b', critHigh:30 },
  streamflow_cfs:    { label:'Streamflow',   unit:'cfs',  color:'#3b82f6' },
  pH:                { label:'pH',           unit:'',     color:'#7c3aed', warnLow:6.5, warnHigh:8.5 },
  turbidity_ntu:     { label:'Turbidity',    unit:'NTU',  color:'#d97706', warnHigh:10, critHigh:25 },
  conductance_us_cm: { label:'Conductance',  unit:'µS/cm',color:'#1d6fcc' },
  total_nitrogen_mg_l:{ label:'Nitrogen',   unit:'mg/L', color:'#dc2626', warnHigh:1.5 },
}

const USGS_SITES = {
  '02428400':'Alabama River at Claiborne',
  '02469761':'Mobile River at I-65',
  '02479000':'Dog River near Mobile',
  '02479155':'Fowl River',
}
const PARAM_CODES = { do_mg_l:'00300', water_temp_c:'00010', streamflow_cfs:'00060', pH:'00400', turbidity_ntu:'00076', conductance_us_cm:'00095' }

function StatBox({ label, value, unit, color, sub }) {
  return (
    <div className="text-center p-2.5 rounded-lg" style={{background:'#f5fbf8',border:'1px solid #cce4d8'}}>
      <div className="tw-label mb-0.5">{label}</div>
      <div className="tw-mono text-base font-bold" style={{color:color||'#1a3028'}}>{value??'—'}{unit&&<span className="text-[10px] font-normal text-bay-400 ml-0.5">{unit}</span>}</div>
      {sub&&<div className="text-[9px] text-bay-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function DoGauge({ value }) {
  const pct = Math.min(100, Math.max(0, ((value||0)/14)*100))
  const color = doColor(value)
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e2f0ea" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${pct * 1.571} 157.1`}/>
        <line x1="60" y1="60" x2={60+44*Math.cos(Math.PI-(pct/100)*Math.PI)} y2={60-44*Math.sin(Math.PI-(pct/100)*Math.PI)} stroke="#1a3028" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="60" cy="60" r="4" fill="#1a3028"/>
      </svg>
      <div className="tw-mono text-xl font-bold -mt-2" style={{color}}>{value!=null?value.toFixed(1):'—'}</div>
      <div className="tw-label">mg/L DO₂</div>
      {value!=null&&<div className="text-[10px] mt-0.5 font-semibold" style={{color}}>{value<3?'CRITICAL — Hypoxic':value<5?'LOW — Stress':value<7?'Moderate':'Good'}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div className="tw-card shadow-md py-2 px-3 text-xs" style={{minWidth:120}}>
      <div className="text-bay-400 mb-1 tw-mono">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{background:p.color||p.fill}}/>
          <span className="text-bay-600">{p.name}:</span>
          <span className="font-bold text-bay-900 tw-mono">{typeof p.value==='number'?p.value.toFixed(2):p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScienceView() {
  const { waterQuality, habAssessment, fetchAll, loading } = useStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSite, setSelectedSite] = useState('02479000')
  const [selectedParam, setSelectedParam] = useState('do_mg_l')
  const [histData, setHistData] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [histDays, setHistDays] = useState(7)

  const loadHistorical = useCallback(async () => {
    const paramCode = PARAM_CODES[selectedParam]
    if (!paramCode || !selectedSite) return
    setHistLoading(true)
    try {
      const res = await fetch(`${API}/api/water/historical/${selectedSite}/${paramCode}?days=${histDays}`)
      const d = await res.json()
      setHistData(d.data || [])
    } catch(e) { console.error(e) }
    finally { setHistLoading(false) }
  }, [selectedSite, selectedParam, histDays])

  useEffect(() => { loadHistorical() }, [loadHistorical])

  const usgs = waterQuality?.usgs || []
  const allDO = usgs.map(s=>safeNum(s.readings?.do_mg_l)).filter(v=>v!=null)
  const allTemp = usgs.map(s=>safeNum(s.readings?.water_temp_c)).filter(v=>v!=null)
  const minDO = allDO.length ? Math.min(...allDO) : null
  const avgDO = allDO.length ? allDO.reduce((a,b)=>a+b,0)/allDO.length : null
  const maxDO = allDO.length ? Math.max(...allDO) : null

  const comparisonData = usgs.filter(s=>safeNum(s.readings?.[selectedParam])!=null).map(s=>({
    name: s.name.split(' at ')[0].split(' near ')[0].substring(0,14),
    value: safeNum(s.readings?.[selectedParam]),
    siteNo: s.siteNo,
  }))

  const histVals = histData.map(d=>d.value).filter(v=>v!=null&&!isNaN(v))
  const histMin = histVals.length ? Math.min(...histVals) : null
  const histMax = histVals.length ? Math.max(...histVals) : null
  const histMean = histVals.length ? histVals.reduce((a,b)=>a+b,0)/histVals.length : null
  const histStd = histVals.length && histMean!=null ? Math.sqrt(histVals.map(v=>(v-histMean)**2).reduce((a,b)=>a+b,0)/histVals.length) : null

  const pmeta = PARAMS[selectedParam]

  const exportCSV = () => {
    const rows = [['timestamp','value',pmeta?.unit||'']]
    histData.forEach(d=>rows.push([d.timestamp, d.value]))
    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `terrawatch_${selectedSite}_${selectedParam}_${histDays}d.csv`
    a.click()
  }

  const exportAllCSV = () => {
    const rows = [['station','siteNo','parameter','value','unit','timestamp']]
    usgs.forEach(s=>{
      Object.entries(s.readings||{}).forEach(([param,reading])=>{
        const v = safeNum(reading)
        const meta = PARAMS[param]
        if(v!=null) rows.push([s.name, s.siteNo, meta?.label||param, v, meta?.unit||'', s.timestamp||''])
      })
    })
    const csv = rows.map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `terrawatch_all_stations_snapshot.csv`
    a.click()
  }

  const TABS = ['overview','time series','station compare','correlation','export']

  return (
    <div className="p-5 max-w-7xl animate-in">
      <PageHeader icon="⬢" title="Science View"
        subtitle="Multi-station analysis · Historical trends · Statistical summary · Data export"
        badge="SCIENTIST TOOLS"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={exportAllCSV} className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors">
              ↓ Export All CSV
            </button>
            <button onClick={fetchAll} disabled={loading.water} className="tw-btn-primary disabled:opacity-50">
              {loading.water?<Spinner size={14}/>:'↺'} Refresh
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
        <div className="tw-card flex flex-col items-center py-3 col-span-1">
          <DoGauge value={minDO} />
          <div className="text-[9px] text-bay-400 mt-1">Network Minimum</div>
        </div>
        <StatBox label="Network Avg DO₂" value={avgDO?.toFixed(1)} unit="mg/L" color={doColor(avgDO)} sub={`${allDO.length} stations`} />
        <StatBox label="Network Max DO₂" value={maxDO?.toFixed(1)} unit="mg/L" color="#10b981" />
        <StatBox label="Avg Water Temp" value={allTemp.length?(allTemp.reduce((a,b)=>a+b,0)/allTemp.length).toFixed(1):null} unit="°C" color="#f59e0b" sub={`${allTemp.length} stations`} />
        <StatBox label="HAB Probability" value={habAssessment?.hab?.probability} unit="%" color={habAssessment?.hab?.probability>=65?'#dc2626':'#0a9e80'}
          sub={habAssessment?.hab?.riskLevel?<RiskBadge level={habAssessment.hab.riskLevel}/>:null} />
      </div>

      <div className="flex gap-0 border-b border-bay-100 mb-4 overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)}
            className={clsx('px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize',
              activeTab===t?'border-teal-600 text-teal-700':'border-transparent text-bay-400 hover:text-bay-600')}>
            {t}
          </button>
        ))}
      </div>

      {activeTab==='overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {usgs.map(s=>{
              const do2=safeNum(s.readings?.do_mg_l)
              const temp=safeNum(s.readings?.water_temp_c)
              const flow=safeNum(s.readings?.streamflow_cfs)
              const pH=safeNum(s.readings?.pH)
              const turb=safeNum(s.readings?.turbidity_ntu)
              const alert=do2!=null&&do2<4
              return (
                <div key={s.siteNo} className={clsx('tw-card',alert&&'border-red-200')} style={alert?{background:'#fef2f2'}:{}}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0',alert?'bg-red-500 animate-pulse':'bg-emerald-500')}/>
                    <div className="font-bold text-sm text-bay-800 flex-1">{s.name}</div>
                    <div className="tw-mono text-[9px] text-bay-300">{s.siteNo}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {l:'DO₂',v:do2?.toFixed(2),u:'mg/L',c:doColor(do2),alert:do2!=null&&do2<4},
                      {l:'Temp',v:temp?.toFixed(1),u:'°C',c:'#f59e0b'},
                      {l:'Flow',v:flow?(flow/1000).toFixed(1):null,u:'K cfs',c:'#3b82f6'},
                      {l:'pH',v:pH?.toFixed(2),u:'',c:'#7c3aed'},
                      {l:'Turbidity',v:turb?.toFixed(1),u:'NTU',c:'#d97706'},
                      {l:'Updated',v:s.timestamp?fmtTime(s.timestamp):null,u:'',c:'#8aadaa'},
                    ].map(({l,v,u,c,alert:a})=>(
                      <div key={l} className={clsx('rounded-lg p-2 text-center',a?'bg-red-50':'bg-bay-50')}>
                        <div className="tw-label mb-0.5">{l}</div>
                        <div className="tw-mono text-sm font-bold" style={{color:v?c:'#aed0c2'}}>{v||'—'}{v&&u&&<span className="text-[9px] font-normal text-bay-400 ml-0.5">{u}</span>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {usgs.length===0&&<div className="tw-card text-center py-8 text-bay-400 text-sm">Loading station data...</div>}
          </div>

          <div className="tw-card">
            <div className="tw-label mb-3">NOAA CO-OPS Tidal Stations</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(waterQuality?.coops||{}).map(s=>(
                <div key={s.id} className="p-3 rounded-lg bg-bay-50">
                  <div className="font-semibold text-sm text-bay-800 mb-2">{s.name}</div>
                  {[{l:'Water Level',v:safeNum(s.water_level),u:'ft MLLW',c:'#1d6fcc'},{l:'Temp',v:safeNum(s.water_temperature),u:'°F',c:'#f59e0b'},{l:'Salinity',v:safeNum(s.salinity),u:'ppt',c:'#7c3aed'}].map(({l,v,u,c})=>(
                    <div key={l} className="flex justify-between py-1 border-b border-bay-100 last:border-0">
                      <span className="text-xs text-bay-400">{l}</span>
                      <span className="tw-mono text-sm font-bold" style={{color:v!=null?c:'#aed0c2'}}>{v!=null?v.toFixed(2):'—'}<span className="text-[9px] font-normal text-bay-400 ml-1">{u}</span></span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab==='time series' && (
        <div className="space-y-4">
          <div className="tw-card">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <div className="tw-label mb-1">Station</div>
                <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)}
                  className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                  {Object.entries(USGS_SITES).map(([id,name])=>(
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="tw-label mb-1">Parameter</div>
                <select value={selectedParam} onChange={e=>setSelectedParam(e.target.value)}
                  className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                  {Object.entries(PARAMS).filter(([k])=>PARAM_CODES[k]).map(([k,m])=>(
                    <option key={k} value={k}>{m.label} ({m.unit||'dim'})</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="tw-label mb-1">Range</div>
                <div className="flex gap-1">
                  {[3,7,14,30].map(d=>(
                    <button key={d} onClick={()=>setHistDays(d)}
                      className={clsx('tw-mono text-[10px] px-2.5 py-1 rounded-lg border transition-colors',histDays===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-500 border-bay-200')}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={exportCSV} disabled={!histData.length}
                className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-colors ml-auto">
                ↓ Export CSV
              </button>
            </div>
          </div>

          {histMean!=null && (
            <div className="grid grid-cols-4 gap-2">
              <StatBox label="Mean" value={histMean.toFixed(2)} unit={pmeta?.unit} color={pmeta?.color} />
              <StatBox label="Min" value={histMin?.toFixed(2)} unit={pmeta?.unit} color={doColor(histMin)} />
              <StatBox label="Max" value={histMax?.toFixed(2)} unit={pmeta?.unit} color="#1d6fcc" />
              <StatBox label="Std Dev" value={histStd?.toFixed(2)} unit={pmeta?.unit} color="#7c3aed" sub={`${histVals.length} readings`} />
            </div>
          )}

          <div className="tw-card">
            <div className="flex items-center justify-between mb-3">
              <div className="tw-label">{USGS_SITES[selectedSite]} — {pmeta?.label} — {histDays}d</div>
              {histLoading&&<Spinner size={16}/>}
            </div>
            {histData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={histData.map(d=>({...d,ts:fmtDate(d.timestamp)}))} margin={{top:4,right:8,bottom:0,left:-10}}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={pmeta?.color||'#0a9e80'} stopOpacity={0.25}/>
                      <stop offset="100%" stopColor={pmeta?.color||'#0a9e80'} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea"/>
                  <XAxis dataKey="ts" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} interval="preserveStartEnd"/>
                  <YAxis tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  {pmeta?.critLow && <ReferenceLine y={pmeta.critLow} stroke="#dc2626" strokeDasharray="4 2" label={{value:'Critical',fontSize:9,fill:'#dc2626',position:'insideRight'}}/>}
                  {pmeta?.warnLow && <ReferenceLine y={pmeta.warnLow} stroke="#f59e0b" strokeDasharray="4 2" label={{value:'Warning',fontSize:9,fill:'#f59e0b',position:'insideRight'}}/>}
                  {pmeta?.warnHigh && <ReferenceLine y={pmeta.warnHigh} stroke="#f59e0b" strokeDasharray="4 2"/>}
                  {histMean!=null && <ReferenceLine y={histMean} stroke="#4a7060" strokeDasharray="2 4" label={{value:'Mean',fontSize:9,fill:'#4a7060',position:'insideLeft'}}/>}
                  <Area type="monotone" dataKey="value" name={pmeta?.label} stroke={pmeta?.color||'#0a9e80'} fill="url(#histGrad)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-12">
                {histLoading?<Spinner size={28}/>:<div className="text-bay-400 text-sm">No historical data for this selection</div>}
              </div>
            )}
          </div>

          {histData.length > 0 && (
            <div className="tw-card">
              <div className="tw-label mb-2">Raw Data — Last 20 Readings</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-bay-100">
                    <th className="text-left py-1.5 text-bay-400 font-medium tw-mono">Timestamp</th>
                    <th className="text-right py-1.5 text-bay-400 font-medium tw-mono">{pmeta?.label} ({pmeta?.unit})</th>
                    <th className="text-center py-1.5 text-bay-400 font-medium tw-mono">Status</th>
                  </tr></thead>
                  <tbody>
                    {[...histData].reverse().slice(0,20).map((d,i)=>{
                      const status = selectedParam==='do_mg_l'&&d.value<3?'critical':selectedParam==='do_mg_l'&&d.value<5?'warning':'normal'
                      return (
                        <tr key={i} className="border-b border-bay-50 last:border-0">
                          <td className="py-1.5 text-bay-400 tw-mono">{new Date(d.timestamp).toLocaleString()}</td>
                          <td className="py-1.5 text-right tw-mono font-bold" style={{color:selectedParam==='do_mg_l'?doColor(d.value):'#1a3028'}}>{typeof d.value==='number'?d.value.toFixed(2):d.value}</td>
                          <td className="py-1.5 text-center">
                            <span className={clsx('tw-badge',status==='critical'?'bg-red-50 text-red-700 border border-red-200':status==='warning'?'bg-amber-50 text-amber-700 border border-amber-200':'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==='station compare' && (
        <div className="space-y-4">
          <div className="tw-card">
            <div className="tw-label mb-2">Parameter to Compare</div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(PARAMS).map(([k,m])=>(
                <button key={k} onClick={()=>setSelectedParam(k)}
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                  style={selectedParam===k?{background:m.color,color:'#fff',borderColor:m.color}:{background:'#fff',color:'#4a7060',borderColor:'#cce4d8'}}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {comparisonData.length ? (
            <>
              <div className="tw-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="tw-label">{pmeta?.label} — All Stations — Current Reading</div>
                  {pmeta?.critLow&&<div className="text-[10px] text-red-600 tw-mono">Critical: &lt;{pmeta.critLow} {pmeta.unit}</div>}
                  {pmeta?.warnLow&&<div className="text-[10px] text-amber-600 tw-mono">Warn: &lt;{pmeta.warnLow} {pmeta.unit}</div>}
                </div>
                <ResponsiveContainer width="100%" height={Math.max(180,comparisonData.length*48)}>
                  <BarChart data={comparisonData} layout="vertical" margin={{top:0,right:40,bottom:0,left:10}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} unit={pmeta?.unit?` ${pmeta.unit}`:''}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'#4a7060'}} width={110}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    {pmeta?.critLow&&<ReferenceLine x={pmeta.critLow} stroke="#dc2626" strokeDasharray="4 2"/>}
                    {pmeta?.warnLow&&<ReferenceLine x={pmeta.warnLow} stroke="#f59e0b" strokeDasharray="4 2"/>}
                    <Bar dataKey="value" name={pmeta?.label} radius={[0,4,4,0]}>
                      {comparisonData.map((d,i)=>(
                        <Cell key={i} fill={selectedParam==='do_mg_l'?doColor(d.value):pmeta?.color||'#0a9e80'}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="tw-card">
                <div className="tw-label mb-2">Ranked — {pmeta?.label}</div>
                {[...comparisonData].sort((a,b)=>a.value-b.value).map((d,i)=>{
                  const pct=(d.value/(Math.max(...comparisonData.map(x=>x.value))||1))*100
                  const color=selectedParam==='do_mg_l'?doColor(d.value):pmeta?.color||'#0a9e80'
                  return (
                    <div key={d.siteNo} className="py-2 border-b border-bay-50 last:border-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="tw-mono text-[10px] text-bay-300 w-4">#{i+1}</span>
                        <span className="text-sm text-bay-700 flex-1">{d.name}</span>
                        <span className="tw-mono text-sm font-bold" style={{color}}>{d.value.toFixed(2)} {pmeta?.unit}</span>
                      </div>
                      <div className="ml-7 h-2 rounded-full bg-bay-50 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:color}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="tw-card text-center py-8 text-bay-400 text-sm">
              {loading.water?<Spinner size={28}/>:'No data for this parameter across stations'}
            </div>
          )}
        </div>
      )}

      {activeTab==='correlation' && (
        <div className="space-y-4">
          <div className="tw-card bg-bay-50 border-bay-200">
            <div className="tw-label mb-1">Temperature vs DO₂ — Current Snapshot</div>
            <div className="text-xs text-bay-400">Each point is one USGS station. Shows the inverse relationship: warmer water holds less dissolved oxygen.</div>
          </div>
          {(() => {
            const scatter = usgs.filter(s=>safeNum(s.readings?.water_temp_c)!=null&&safeNum(s.readings?.do_mg_l)!=null)
              .map(s=>({ x:safeNum(s.readings.water_temp_c), y:safeNum(s.readings.do_mg_l), name:s.name.split(' at ')[0] }))
            return scatter.length >= 2 ? (
              <div className="tw-card">
                <div className="tw-label mb-3">Temperature (°C) vs DO₂ (mg/L)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart margin={{top:4,right:8,bottom:20,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea"/>
                    <XAxis type="number" dataKey="x" name="Temp" unit="°C" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}} label={{value:'Temperature (°C)',position:'insideBottom',offset:-10,fontSize:10,fill:'#4a7060'}}/>
                    <YAxis type="number" dataKey="y" name="DO₂" unit=" mg/L" tick={{fontSize:9,fill:'#4a7060',fontFamily:'JetBrains Mono'}}/>
                    <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{value:'Stress threshold',fontSize:9,fill:'#f59e0b',position:'right'}}/>
                    <ReferenceLine y={3} stroke="#dc2626" strokeDasharray="4 2" label={{value:'Critical',fontSize:9,fill:'#dc2626',position:'right'}}/>
                    <Tooltip content={({active,payload})=>{ if(!active||!payload?.length) return null; const d=payload[0]?.payload; return <div className="tw-card shadow-md py-2 px-3 text-xs"><div className="font-bold text-bay-800 mb-1">{d.name}</div><div className="tw-mono text-bay-600">Temp: {d.x?.toFixed(1)}°C</div><div className="tw-mono" style={{color:doColor(d.y)}}>DO₂: {d.y?.toFixed(2)} mg/L</div></div>}}/>
                    <Scatter data={scatter} fill="#0a9e80">
                      {scatter.map((d,i)=><Cell key={i} fill={doColor(d.y)}/>)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-bay-50">
                  {[{l:'Warm + Low DO₂',c:'#dc2626',desc:'Hypoxia risk zone — summer stratification'},{l:'Moderate',c:'#f59e0b',desc:'Monitoring — possible stratification forming'},{l:'Cool + Good DO₂',c:'#10b981',desc:'Healthy — well-mixed water column'}].map(z=>(
                    <div key={z.l} className="p-2 rounded bg-bay-50 text-center">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{background:z.c}}/>
                      <div className="text-[10px] font-semibold" style={{color:z.c}}>{z.l}</div>
                      <div className="text-[9px] text-bay-400 leading-tight mt-0.5">{z.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tw-card text-center py-8 text-bay-400 text-sm">Need ≥2 stations with both temperature and DO₂ readings</div>
            )
          })()}
        </div>
      )}

      {activeTab==='export' && (
        <div className="space-y-3">
          <div className="tw-card">
            <div className="tw-label mb-2">Snapshot Export</div>
            <div className="text-sm text-bay-600 mb-3">Current readings from all USGS and CO-OPS stations — formatted for spreadsheet analysis.</div>
            <button onClick={exportAllCSV} className="tw-btn-primary">
              ↓ Download All Stations CSV
            </button>
          </div>
          <div className="tw-card">
            <div className="tw-label mb-2">Historical Time Series Export</div>
            <div className="text-sm text-bay-600 mb-3">Select a station and parameter in the Time Series tab, then export up to 30 days of hourly readings.</div>
            <div className="flex gap-3 items-center flex-wrap">
              <select value={selectedSite} onChange={e=>setSelectedSite(e.target.value)} className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                {Object.entries(USGS_SITES).map(([id,name])=><option key={id} value={id}>{name}</option>)}
              </select>
              <select value={selectedParam} onChange={e=>setSelectedParam(e.target.value)} className="text-sm border border-bay-200 rounded-lg px-3 py-1.5 text-bay-700 bg-white">
                {Object.entries(PARAMS).filter(([k])=>PARAM_CODES[k]).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}
              </select>
              {[3,7,14,30].map(d=>(
                <button key={d} onClick={()=>setHistDays(d)} className={clsx('tw-mono text-[10px] px-2.5 py-1 rounded-lg border',histDays===d?'bg-teal-700 text-white border-teal-700':'bg-white text-bay-500 border-bay-200')}>
                  {d}d
                </button>
              ))}
              <button onClick={()=>{loadHistorical().then(exportCSV)}} disabled={histLoading} className="tw-btn-primary disabled:opacity-50">
                {histLoading?<Spinner size={14}/>:'↓'} Export Time Series CSV
              </button>
            </div>
            {histData.length>0&&<div className="text-xs text-bay-400 mt-2 tw-mono">{histData.length} readings ready · {pmeta?.label} · {USGS_SITES[selectedSite]}</div>}
          </div>
          <div className="tw-card bg-bay-50">
            <div className="tw-label mb-2">API Direct Access</div>
            <div className="text-sm text-bay-600 mb-2">All TERRAWATCH data is accessible via REST API for direct integration into R, Python, or MATLAB workflows.</div>
            <div className="space-y-1.5">
              {[
                {label:'All stations realtime',url:'GET /api/water/realtime'},
                {label:'HAB Oracle assessment',url:'GET /api/hab/assess'},
                {label:'Historical data (any station/param)',url:'GET /api/water/historical/{siteNo}/{paramCode}?days=7'},
                {label:'Active alerts',url:'GET /api/alerts'},
                {label:'Sensor registry',url:'GET /api/sensors/registry'},
                {label:'ML Architecture v2 spec',url:'GET /api/ml/spec'},
              ].map(({label,url})=>(
                <div key={url} className="flex items-center gap-3 py-1.5 border-b border-bay-100 last:border-0">
                  <span className="text-xs text-bay-500 flex-1">{label}</span>
                  <code className="tw-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{url}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useStore } from '../store/index.js'
import { PageHeader, Spinner, RiskBadge } from '../components/Common/index.jsx'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import clsx from 'clsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

const PHASE_COLORS = { 0:'#94a3b8', 1:'#3b82f6', 2:'#8b5cf6', 3:'#10b981' }
const PHASE_LABELS = { 0:'Accumulating', 1:'Logistic Reg', 2:'Random Forest', 3:'CNN-LSTM (Vertex)' }

function safeNum(v){ if(v==null)return null; if(typeof v==='number')return isNaN(v)?null:v; const n=parseFloat(v); return isNaN(n)?null:n }

function ProgressBar({ pct, color='#10b981', label, value }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="tw-label">{label}</span>
        <span className="tw-mono text-[10px] text-bay-500">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-bay-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(100,pct||0)}%`, background:color}}/>
      </div>
    </div>
  )
}

function PhaseCard({ phase, current, threshold, samples }) {
  const active = current === phase
  const done = current > phase
  const color = PHASE_COLORS[phase]
  return (
    <div className={clsx('tw-card border-l-2 transition-all', active ? 'shadow-md' : '')}
      style={active ? {borderLeftColor:color} : {borderLeftColor:'#e2f0ea'}}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{background: done||active ? color:'#e2f0ea', color: done||active?'#fff':'#4a7060'}}>
          {done ? '✓' : phase}
        </div>
        <span className="text-[11px] font-bold" style={{color: active ? color : '#4a7060'}}>{PHASE_LABELS[phase]}</span>
        {active && <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded" style={{background:color+'20',color}}>ACTIVE</span>}
      </div>
      <div className="text-[10px] text-bay-400 leading-relaxed">
        {phase === 0 && 'Storing every reading. No model yet — just accumulating signal.'}
        {phase === 1 && `${threshold}+ labeled samples → logistic regression, pure JS, no external ML services.`}
        {phase === 2 && `${threshold}+ samples → random forest with improved feature interactions.`}
        {phase === 3 && `${threshold}+ samples → CNN-LSTM datacube on Vertex AI. 8-day forecast horizon. Karenia species attribution.`}
      </div>
      {phase > 0 && <div className="mt-1.5">
        <ProgressBar pct={Math.min(100,(samples/threshold)*100)} color={color} label="Progress" value={`${samples}/${threshold}`}/>
      </div>}
    </div>
  )
}

export default function Intelligence() {
  const [status, setStatus]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [retraining, setRetraining] = useState(false)
  const [retrainResult, setRetrainResult] = useState(null)
  const [tab, setTab] = useState('overview')

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${API}/api/intelligence/status`)
      setStatus(await r.json())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStatus() }, [])

  const triggerRetrain = async () => {
    setRetraining(true); setRetrainResult(null)
    try {
      const r = await fetch(`${API}/api/intelligence/retrain`, { method:'POST' })
      setRetrainResult(await r.json())
      await fetchStatus()
    } catch(e) { setRetrainResult({ status:'error', error: e.message }) }
    finally { setRetraining(false) }
  }

  const db = status?.database || {}
  const phase = status?.phases?.current || 0
  const phaseColor = PHASE_COLORS[phase]
  const models = status?.models || []
  const events = status?.recentEvents || []
  const labeled = db.labeled || 0
  const vectors = db.vectors || 0

  const TABS = ['overview','models','events','phase 3']

  return (
    <div className="p-5 max-w-6xl animate-in">
      <PageHeader icon="◈" title="Intelligence Engine"
        subtitle="Phase 1+2+3 learning flywheel · SQLite persistence · Auto-labeling · Weekly retraining"
        badge="ML PIPELINE"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={triggerRetrain} disabled={retraining || labeled < 10}
              className="tw-btn-primary disabled:opacity-50 text-xs">
              {retraining ? <><Spinner size={12}/> Training...</> : '▶ Retrain Now'}
            </button>
            <button onClick={fetchStatus} className="tw-btn text-xs">↺ Refresh</button>
          </div>
        }
      />

      {loading ? <div className="flex justify-center py-16"><Spinner size={32}/></div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
            {[
              { l:'Active phase',   v: PHASE_LABELS[phase], c: phaseColor, mono: false },
              { l:'Total readings', v: db.readings?.toLocaleString() || '0', c:'#1a3028' },
              { l:'Feature vectors',v: vectors.toLocaleString(), c:'#1a3028' },
              { l:'Labeled rows',   v: labeled.toLocaleString(), c: phaseColor },
              { l:'DB age',         v: db.daysSinceStart ? `${db.daysSinceStart}d` : 'New', c:'#4a7060' },
            ].map(({ l, v, c, mono }) => (
              <div key={l} className="p-2.5 rounded-lg bg-bay-50 border border-bay-100 text-center">
                <div className="tw-label mb-0.5">{l}</div>
                <div className={clsx('text-sm font-bold', mono !== false && 'tw-mono')} style={{color:c}}>{v||'—'}</div>
              </div>
            ))}
          </div>

          {retrainResult && (
            <div className={clsx('p-3 rounded-lg border mb-4 text-sm',
              retrainResult.status==='promoted' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              retrainResult.status==='held'      ? 'bg-amber-50 border-amber-200 text-amber-800' :
              retrainResult.status==='skipped'   ? 'bg-blue-50 border-blue-200 text-blue-800' :
              'bg-red-50 border-red-200 text-red-800')}>
              <div className="font-semibold mb-0.5">{retrainResult.status?.toUpperCase()} — {retrainResult.note || retrainResult.reason || retrainResult.message}</div>
              {retrainResult.aucRoc && <div className="tw-mono text-[10px]">AUC-ROC: {retrainResult.aucRoc} | Accuracy: {retrainResult.accuracy} | Phase {retrainResult.phase} | {retrainResult.nSamples} samples | {retrainResult.trainMs}ms</div>}
              {retrainResult.progress != null && <div className="mt-1"><ProgressBar pct={retrainResult.progress*100} color="#3b82f6" label="Data progress to Phase 1" value={`${labeled}/100`}/></div>}
            </div>
          )}

          <div className="flex gap-0 border-b border-bay-100 mb-4">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
                  tab===t ? 'border-teal-600 text-teal-700' : 'border-transparent text-bay-400 hover:text-bay-600')}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="tw-label mb-2">Learning phases</div>
                {[0,1,2,3].map(p => (
                  <PhaseCard key={p} phase={p} current={phase}
                    threshold={p===1?100:p===2?500:p===3?2000:0}
                    samples={labeled} />
                ))}
              </div>

              <div className="space-y-3">
                <div className="tw-card">
                  <div className="tw-label mb-3">Phase 3 readiness</div>
                  <div className="space-y-3">
                    <ProgressBar
                      pct={db.phase3Progress?.vectors || 0}
                      color="#8b5cf6"
                      label="Feature vectors"
                      value={`${vectors.toLocaleString()} / 2,000`}
                    />
                    <ProgressBar
                      pct={db.phase3Progress?.labeled || 0}
                      color="#10b981"
                      label="Labeled samples"
                      value={`${labeled.toLocaleString()} / 200`}
                    />
                  </div>
                  {db.phase3Ready && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-[11px] font-bold text-emerald-700">Phase 3 threshold met</div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">Add GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY to Replit Secrets to activate CNN-LSTM training on Vertex AI.</div>
                    </div>
                  )}
                </div>

                <div className="tw-card">
                  <div className="tw-label mb-2">What TERRAWATCH learns</div>
                  <div className="space-y-1.5">
                    {[
                      { icon:'🔵', l:'DO₂ threshold crossings', d:'Every hypoxic event becomes a labeled training sample' },
                      { icon:'🟢', l:'HAB precursor patterns', d:'Warm water + high flow + summer → HAB probability' },
                      { icon:'🟠', l:'Upstream lag signals', d:'Dog River readings predict Weeks Bay in X hours via HF Radar' },
                      { icon:'🟣', l:'Cross-sensor correlations', d:'50+ features per tick capture complex environment interactions' },
                      { icon:'⚪', l:'Seasonal baselines', d:'Year-over-year context for all parameters' },
                    ].map(({ icon, l, d }) => (
                      <div key={l} className="flex gap-2 py-1.5 border-b border-bay-50 last:border-0">
                        <span style={{fontSize:14}}>{icon}</span>
                        <div>
                          <div className="text-[11px] font-semibold text-bay-700">{l}</div>
                          <div className="text-[10px] text-bay-400">{d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tw-card bg-bay-50">
                  <div className="tw-label mb-1">Database</div>
                  <div className="space-y-1 tw-mono text-[10px] text-bay-500">
                    <div className="flex justify-between"><span>File</span><span className="text-bay-700 truncate ml-2">data/terrawatch.db</span></div>
                    <div className="flex justify-between"><span>Size</span><span className="text-bay-700">{db.dbSizeMB || 0} MB</span></div>
                    <div className="flex justify-between"><span>Oldest</span><span className="text-bay-700">{db.oldestReading ? new Date(db.oldestReading).toLocaleDateString() : '—'}</span></div>
                    <div className="flex justify-between"><span>Newest</span><span className="text-bay-700">{db.newestReading ? new Date(db.newestReading).toLocaleDateString() : '—'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'models' && (
            <div className="space-y-3">
              {models.length === 0 ? (
                <div className="tw-card text-center py-10">
                  <div className="text-2xl mb-2">◈</div>
                  <div className="text-sm font-semibold text-bay-700 mb-1">No models trained yet</div>
                  <div className="text-xs text-bay-400 max-w-xs mx-auto">Accumulate {100 - labeled} more labeled samples to train the first logistic regression model. This happens automatically once enough threshold-crossing events occur.</div>
                  <div className="mt-3">
                    <ProgressBar pct={(labeled/100)*100} color="#3b82f6" label="Progress to first model" value={`${labeled}/100`}/>
                  </div>
                </div>
              ) : models.map((m, i) => (
                <div key={i} className={clsx('tw-card', m.deployed && 'border-emerald-300 bg-emerald-50')}>
                  <div className="flex items-center gap-2 mb-2">
                    {m.deployed && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">DEPLOYED</span>}
                    <span className="font-bold text-sm text-bay-800">{m.version}</span>
                    <span className="tw-mono text-[9px] text-bay-400">{m.model_type}</span>
                    <span className="tw-mono text-[9px] px-2 py-0.5 rounded" style={{background:PHASE_COLORS[m.phase]+'20',color:PHASE_COLORS[m.phase]}}>Phase {m.phase}</span>
                    <span className="text-[10px] text-bay-400 ml-auto">{new Date(m.ts).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {l:'AUC-ROC', v: m.auc_roc?.toFixed(3)},
                      {l:'Accuracy', v: m.accuracy ? `${(m.accuracy*100).toFixed(1)}%` : '—'},
                      {l:'Samples', v: m.n_samples?.toLocaleString()},
                      {l:'Phase', v: PHASE_LABELS[m.phase]},
                    ].map(({l,v}) => (
                      <div key={l} className="text-center p-2 rounded bg-white border border-bay-100">
                        <div className="tw-label">{l}</div>
                        <div className="tw-mono text-sm font-bold text-bay-800">{v||'—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'events' && (
            <div className="tw-card">
              <div className="tw-label mb-3">Auto-labeled events (threshold crossings → training labels)</div>
              {events.length === 0 ? (
                <div className="text-center py-8 text-bay-400 text-sm">No threshold-crossing events recorded yet. Events are logged automatically when DO₂ &lt; 3 mg/L or HAB precursors are detected.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-bay-100">
                    <th className="text-left py-1.5 text-bay-400 font-medium">Time</th>
                    <th className="text-left py-1.5 text-bay-400 font-medium">Event type</th>
                    <th className="text-left py-1.5 text-bay-400 font-medium">Station</th>
                    <th className="text-right py-1.5 text-bay-400 font-medium">Value</th>
                    <th className="text-left py-1.5 text-bay-400 font-medium">Source</th>
                  </tr></thead>
                  <tbody>
                    {events.map((e, i) => (
                      <tr key={i} className="border-b border-bay-50 last:border-0 hover:bg-bay-50">
                        <td className="py-1.5 text-bay-400 tw-mono">{new Date(e.ts).toLocaleString()}</td>
                        <td className="py-1.5">
                          <span className={clsx('tw-badge text-[9px]', e.event_type==='hypoxia' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                            {e.event_type}
                          </span>
                        </td>
                        <td className="py-1.5 text-bay-600 tw-mono text-[10px]">{e.station}</td>
                        <td className="py-1.5 text-right tw-mono font-bold text-red-600">{safeNum(e.value)?.toFixed(2)}</td>
                        <td className="py-1.5 text-bay-400 text-[10px]">{e.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'phase 3' && (
            <div className="space-y-3">
              <div className={clsx('tw-card', db.phase3Ready ? 'border-emerald-300' : 'border-purple-200 bg-purple-50')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="font-bold text-sm" style={{color:'#7c3aed'}}>CNN-LSTM on Vertex AI</div>
                  {db.phase3Ready
                    ? <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">THRESHOLD MET</span>
                    : <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">PRE-WIRED</span>}
                </div>
                <div className="space-y-2 text-xs text-bay-600">
                  <p>When {2000 - labeled > 0 ? `${(2000-labeled).toLocaleString()} more labeled samples are accumulated` : 'the threshold is met'}, TERRAWATCH automatically switches from local logistic regression to a full CNN-LSTM datacube model trained on Vertex AI.</p>
                  <p>The CNN-LSTM extends the HAB Oracle forecast horizon from 72 hours to <span className="font-semibold text-bay-800">8 days</span>, and enables Karenia brevis species-level attribution using the PACE OCI 588nm peridinin spectral band.</p>
                </div>
              </div>

              <div className="tw-card">
                <div className="tw-label mb-3">Activation checklist</div>
                {[
                  { done: labeled >= 2000, l:'2,000+ labeled vectors accumulated', v:`${labeled}/2,000` },
                  { done: false, l:'GCP_PROJECT secret added to Replit', v:'Add to Replit Secrets' },
                  { done: false, l:'VERTEX_SERVICE_ACCOUNT_KEY added to Replit', v:'Add to Replit Secrets' },
                  { done: true,  l:'Training pipeline pre-wired in mlTrainer.js', v:'Ready' },
                  { done: true,  l:'Export endpoint ready (/api/intelligence/export-training-data)', v:'Ready' },
                  { done: true,  l:'Auto-promotion logic in place', v:'Promotes if AUC-ROC improves' },
                ].map(({ done, l, v }) => (
                  <div key={l} className="flex items-center gap-2 py-2 border-b border-bay-50 last:border-0">
                    <div className={clsx('w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0', done ? 'bg-emerald-500' : 'bg-bay-200')}>
                      {done ? '✓' : '○'}
                    </div>
                    <span className={clsx('text-xs flex-1', done ? 'text-bay-700' : 'text-bay-500')}>{l}</span>
                    <span className="tw-mono text-[9px] text-bay-400">{v}</span>
                  </div>
                ))}
              </div>

              <div className="tw-card bg-bay-50">
                <div className="tw-label mb-2">GCP Secrets needed for Phase 3</div>
                <div className="space-y-2">
                  {[
                    { key:'GCP_PROJECT', desc:'Your GCP project ID (e.g. terrawatch-prod)', register:'console.cloud.google.com' },
                    { key:'GCP_REGION', desc:'Vertex AI region (default: us-central1)', register:'Already set as default' },
                    { key:'VERTEX_SERVICE_ACCOUNT_KEY', desc:'Service account JSON key with Vertex AI user role', register:'IAM & Admin → Service Accounts' },
                  ].map(({ key, desc, register }) => (
                    <div key={key} className="flex items-start gap-2 py-1.5 border-b border-bay-100 last:border-0">
                      <code className="tw-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0">{key}</code>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-bay-600">{desc}</div>
                        <div className="text-[9px] text-bay-400">{register}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

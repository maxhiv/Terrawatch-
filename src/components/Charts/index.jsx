import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tw-card shadow-md py-2 px-3 text-xs" style={{ minWidth: 120 }}>
      <div className="text-bay-400 mb-1 tw-mono">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-bay-600">{p.name}:</span>
          <span className="font-bold text-bay-900 tw-mono">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function doColor(v) {
  return v == null ? '#4a7060' : v < 3 ? '#dc2626' : v < 5 ? '#f59e0b' : '#10b981'
}

export function DOChart({ data, height = 200 }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} domain={[0, 'auto']} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={3} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'Hypoxic', fontSize: 9, fill: '#dc2626' }} />
        <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Stress', fontSize: 9, fill: '#f59e0b' }} />
        <Area type="monotone" dataKey="value" name="DO₂ mg/L" stroke="#10b981" fill="url(#doGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function HABProbabilityChart({ data, height = 200 }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={65} stroke="#dc2626" strokeDasharray="4 2" label={{ value: 'High Risk', fontSize: 9, fill: '#dc2626', position: 'insideRight' }} />
        <Bar dataKey="probability" name="HAB Risk %" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.probability >= 65 ? '#dc2626' : d.probability >= 45 ? '#f59e0b' : '#10b981'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

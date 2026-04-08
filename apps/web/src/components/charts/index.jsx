import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend } from 'recharts'

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

export function WeatherForecastChart({ data, height = 200 }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <YAxis yAxisId="temp" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
        <Line yAxisId="temp" type="monotone" dataKey="high" name="High °F" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
        <Line yAxisId="temp" type="monotone" dataKey="low" name="Low °F" stroke="#1d6fcc" strokeWidth={2} dot={{ r: 3 }} />
        <Line yAxisId="precip" type="monotone" dataKey="precipChance" name="Rain %" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AirQualityChart({ data, height = 180 }) {
  if (!data?.length) return null
  const hasMultiSource = data.some(d => d.openAQ != null || d.purpleAir != null || d.epaAQS != null)
  function aqiColor(v) {
    if (v <= 50) return '#10b981'
    if (v <= 100) return '#f59e0b'
    if (v <= 150) return '#f97316'
    if (v <= 200) return '#dc2626'
    return '#7c2d12'
  }
  if (hasMultiSource) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
          <XAxis dataKey="parameter" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
          <YAxis tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} domain={[0, 'auto']} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
          <Bar dataKey="airNow" name="AirNow" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="openAQ" name="OpenAQ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="purpleAir" name="PurpleAir" fill="#a855f7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="epaAQS" name="EPA AQS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis dataKey="parameter" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} domain={[0, 'auto']} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Moderate', fontSize: 9, fill: '#f59e0b', position: 'insideRight' }} />
        <Bar dataKey="aqi" name="AQI" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={aqiColor(d.aqi)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SatelliteTimelineChart({ data, height = 160 }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis type="number" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} width={90} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="granules" name="Granules" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.available ? '#10b981' : '#cbd5e1'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OceanConditionsChart({ data, height = 180 }) {
  if (!data?.length) return null
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="sstGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d6fcc" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#1d6fcc" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2f0ea" />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 9, fill: '#4a7060', fontFamily: 'JetBrains Mono' }} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="sst" name="SST °C" stroke="#1d6fcc" fill="url(#sstGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

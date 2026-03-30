import { useState, useEffect } from 'react'

const API = '/api'

function StationCard({ station }) {
  const r = station.readings || {}
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{station.name}</h3>
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
          {station.siteNo}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Streamflow', r.streamflow_cfs, 'cfs'],
          ['Water Temp', r.water_temp_c, '°C'],
          ['DO', r.do_mg_l, 'mg/L'],
          ['pH', r.pH, ''],
          ['Turbidity', r.turbidity_ntu, 'NTU'],
          ['Conductance', r.conductance_us_cm, 'µS/cm'],
        ].map(([label, val, unit]) => (
          <div key={label} className="text-xs">
            <span style={{ color: '#64748b' }}>{label}</span>
            <div className="font-mono text-white">
              {val !== undefined && val !== null ? `${val.toFixed ? val.toFixed(2) : val} ${unit}` : '—'}
            </div>
          </div>
        ))}
      </div>
      {station.timestamp && (
        <div className="text-xs mt-3" style={{ color: '#475569' }}>
          Updated: {new Date(station.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default function WaterQuality() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API}/water/realtime`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">💧 Water Quality</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Real-time USGS NWIS & NOAA CO-OPS monitoring — Mobile Bay watershed
          </p>
        </div>
        {loading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {error && (
        <div className="card p-4 border-red-800" style={{ borderColor: '#991b1b' }}>
          <p className="text-sm text-red-400">Error fetching data: {error}</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Data will retry on next interval.</p>
        </div>
      )}

      {data?.usgs && data.usgs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>USGS Monitoring Stations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.usgs.map(station => (
              <StationCard key={station.siteNo} station={station} />
            ))}
          </div>
        </div>
      )}

      {data?.coops && Object.keys(data.coops).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>NOAA CO-OPS Tidal Stations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(data.coops).map(([id, station]) => (
              <div key={id} className="card p-4">
                <h3 className="text-sm font-semibold text-white mb-3">{station.name}</h3>
                <div className="space-y-1 text-xs">
                  {[
                    ['Water Level', station.water_level, 'ft'],
                    ['Water Temp', station.water_temperature, '°F'],
                    ['Salinity', station.salinity, 'ppt'],
                  ].map(([label, reading, unit]) => (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span className="font-mono text-white">
                        {reading?.value !== undefined && reading?.value !== null
                          ? `${Number(reading.value).toFixed(2)} ${unit}`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.buoy && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>NDBC Buoy 42012 — Offshore Gulf</h2>
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Wave Height', data.buoy.WVHT, 'm'],
                ['Wind Speed', data.buoy.WSPD, 'm/s'],
                ['Wind Gust', data.buoy.GST, 'm/s'],
                ['Water Temp', data.buoy.WTMP, '°C'],
                ['Air Temp', data.buoy.ATMP, '°C'],
                ['Pressure', data.buoy.PRES, 'hPa'],
                ['Wind Dir', data.buoy.WDIR, '°'],
                ['Dew Point', data.buoy.DEWP, '°C'],
              ].map(([label, val, unit]) => (
                <div key={label} className="text-xs">
                  <div style={{ color: '#64748b' }}>{label}</div>
                  <div className="font-mono text-white">
                    {val !== null && val !== undefined ? `${val} ${unit}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !data && (
        <div className="card p-8 text-center">
          <p style={{ color: '#64748b' }}>No data available. Check server connectivity.</p>
        </div>
      )}
    </div>
  )
}

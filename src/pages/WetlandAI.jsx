export default function WetlandAI() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🌿 WetlandAI</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Remote wetland pre-delineation using 7.5cm aerial imagery
        </p>
      </div>

      <div className="card p-8 text-center space-y-4">
        <div className="text-5xl">🌿</div>
        <h2 className="text-lg font-semibold text-white">WetlandAI Pre-Delineation</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#64748b' }}>
          Automated Section 404 wetland delineation using sub-meter aerial imagery, NDVI analysis, and hydric soil mapping. Reduces field work by up to 80%.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
          {[
            { icon: '✈️', title: '7.5cm Resolution', desc: 'Vexcel UltraCam aerial imagery at sub-meter resolution' },
            { icon: '🌱', title: 'NDVI Analysis', desc: 'Normalized Difference Vegetation Index for vegetation mapping' },
            { icon: '📋', title: 'Section 404', desc: 'Pre-delineation reports for Army Corps of Engineers submissions' },
          ].map(f => (
            <div key={f.title} className="p-4 rounded" style={{ backgroundColor: '#0a0d12', border: '1px solid #1e293b' }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded text-xs font-mono" style={{ backgroundColor: '#0a0d12', color: '#64748b', border: '1px solid #1e293b' }}>
          Module pending Vexcel Data Program integration — Contact sales for evaluation access
        </div>
      </div>
    </div>
  )
}

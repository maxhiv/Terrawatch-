import { PageHeader, Section } from '../components/Common/index.jsx'

export default function VisionPage() {
  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="★" title="Vision" subtitle="TERRAWATCH platform vision + roadmap" />
      <Section title="Mission">
        <div className="tw-card">
          <div className="text-sm text-bay-600 leading-relaxed space-y-3">
            <p className="text-lg font-bold text-bay-800">"Give the world eyes on its ecosystems."</p>
            <p>TERRAWATCH is a planetary environmental intelligence platform, starting with Mobile Bay, Alabama — one of the most biodiverse estuaries in North America.</p>
            <p>By integrating 22+ real-time government data feeds with machine learning, TERRAWATCH provides actionable environmental intelligence for researchers, resource managers, and coastal communities.</p>
          </div>
        </div>
      </Section>

      <Section title="Platform Capabilities">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: 'HAB Oracle', desc: 'World-first harmful algal bloom prediction system combining satellite, in-situ, and meteorological data with Bayesian inference.', badge: 'WORLD FIRST' },
            { title: 'Hypoxia Forecasting', desc: 'Dead zone prediction with Jubilee event forecasting for Mobile Bay eastern shore communities.', badge: 'WORLD FIRST' },
            { title: 'WetlandAI', desc: 'Autonomous wetland delineation and blue carbon MRV using satellite imagery and machine learning.', badge: 'WORLD FIRST' },
            { title: 'SITEVAULT', desc: 'Environmental compliance monitoring with autonomous stormwater reporting and satellite change detection.' },
            { title: 'Science View', desc: 'Multi-station analysis, historical trends, statistical summary, and CSV data export for researchers.' },
            { title: 'Feed Status', desc: 'Real-time monitoring dashboard for all 22+ environmental data feeds from NASA, NOAA, EPA, and ESA.' },
          ].map(item => (
            <div key={item.title} className="tw-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-bold text-sm text-bay-800">{item.title}</div>
                {item.badge && <span className="tw-mono text-[7px] px-1 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">★</span>}
              </div>
              <div className="text-xs text-bay-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

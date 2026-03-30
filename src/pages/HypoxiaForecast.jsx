import { useStore } from '../store/index.js'
import { PageHeader, StatCard, RiskBadge, Section } from '../components/Common/index.jsx'

export default function HypoxiaForecast() {
  const { habAssessment, waterQuality } = useStore()
  const hypoxia = habAssessment?.hypoxia

  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="〇" title="Hypoxia Forecast" subtitle="Dead zone prediction · Jubilee event forecasting · Mobile Bay bottom water" badge="WORLD FIRST" />

      <Section title="Current Assessment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Hypoxia Probability" value={hypoxia?.probability ?? '—'} unit="%" color={hypoxia?.probability >= 60 ? '#dc2626' : '#d97706'} icon="〇" />
          <StatCard label="Risk Level" value={hypoxia?.riskLevel || '—'} color="#0a9e80" icon="⬡" sub={hypoxia?.riskLevel ? <RiskBadge level={hypoxia.riskLevel} /> : null} />
          <StatCard label="Jubilee Risk" value={hypoxia?.jubileeRisk ? 'ELEVATED' : 'LOW'} color={hypoxia?.jubileeRisk ? '#dc2626' : '#0a9e80'} icon="★" sub="Eastern shore Mobile Bay" />
          <StatCard label="Bottom DO₂" value={hypoxia?.bottomDO ?? '—'} unit="mg/L" color="#1d6fcc" icon="○" />
        </div>
      </Section>

      <Section title="Methodology">
        <div className="tw-card">
          <div className="text-sm text-bay-600 leading-relaxed space-y-3">
            <p>Hypoxia forecasting combines stratification modeling with real-time dissolved oxygen data from the USGS and NERRS sensor networks. Key inputs include:</p>
            <ul className="list-disc pl-5 space-y-1 text-bay-500">
              <li>Water temperature differential (surface vs bottom) — stratification strength</li>
              <li>Wind speed and direction — mixing potential</li>
              <li>River discharge (Alabama + Mobile Rivers) — freshwater cap formation</li>
              <li>Tidal phase — neap tides reduce mixing energy</li>
              <li>Nutrient loading estimates from USGS streamflow × concentration</li>
            </ul>
            <p>Jubilee events on the eastern shore of Mobile Bay occur when hypoxic bottom water is pushed shoreward by sustained easterly winds during neap tides, driving fish and crabs to shore.</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

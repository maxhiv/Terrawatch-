import { PageHeader, Section } from '../components/Common/index.jsx'

export default function SITEVAULT() {
  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="⊟" title="SITEVAULT" subtitle="Environmental compliance site monitoring + autonomous reporting" />
      <Section title="Overview">
        <div className="tw-card">
          <div className="text-sm text-bay-600 leading-relaxed space-y-3">
            <p>SITEVAULT provides automated environmental compliance monitoring for construction and industrial sites in the Mobile Bay watershed.</p>
            <p>Features include: autonomous stormwater monitoring, NPDES permit compliance tracking, erosion detection via satellite change detection, and automated regulatory reporting.</p>
            <p className="tw-mono text-[10px] text-bay-300">Module under development — integration with EPA ECHO discharge data is active on the Feed Status page.</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

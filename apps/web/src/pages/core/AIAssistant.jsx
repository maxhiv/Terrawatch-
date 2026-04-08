import { PageHeader, Section } from '../../components/common/index.jsx'

export default function AIAssistant() {
  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="◇" title="AI Field Assistant" subtitle="Claude-powered environmental intelligence assistant" />
      <Section title="Capabilities">
        <div className="tw-card">
          <div className="text-sm text-bay-600 leading-relaxed space-y-3">
            <p>The AI Field Assistant provides natural language access to all TERRAWATCH data streams and analysis capabilities.</p>
            <ul className="list-disc pl-5 space-y-1 text-bay-500">
              <li>Query current water quality across all stations</li>
              <li>Interpret HAB Oracle risk assessments</li>
              <li>Explain hypoxia conditions and Jubilee event likelihood</li>
              <li>Provide regulatory compliance guidance</li>
              <li>Generate environmental reports</li>
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-bay-50 border border-bay-100">
              <div className="tw-label mb-1">Setup Required</div>
              <div className="text-xs text-bay-500">Add <code className="tw-mono text-teal-700 bg-teal-50 px-1 rounded">ANTHROPIC_API_KEY</code> to Replit Secrets to enable the AI assistant.</div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

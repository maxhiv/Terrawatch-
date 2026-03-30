import { useStore } from '../store/index.js'
import { PageHeader, Section, AlertBanner } from '../components/Common/index.jsx'

export default function AlertsPage() {
  const { alerts, fetchAlerts } = useStore()

  return (
    <div className="p-6 max-w-5xl animate-in">
      <PageHeader icon="◉" title="Alert Center" subtitle="Active NWS weather alerts + environmental warnings" actions={
        <button onClick={fetchAlerts} className="tw-btn-primary">↺ Refresh</button>
      } />

      {alerts.length > 0 ? (
        <Section title={`${alerts.length} Active Alert${alerts.length > 1 ? 's' : ''}`}>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <AlertBanner key={i} type={alert.severity === 'Extreme' || alert.severity === 'Severe' ? 'error' : 'warning'}>
                <div className="font-bold mb-1">{alert.headline || alert.event}</div>
                <div className="text-xs opacity-80">{alert.description?.substring(0, 300)}...</div>
                {alert.instruction && <div className="text-xs mt-2 opacity-70"><strong>Action:</strong> {alert.instruction.substring(0, 200)}</div>}
              </AlertBanner>
            ))}
          </div>
        </Section>
      ) : (
        <div className="tw-card text-center py-12">
          <div className="text-3xl mb-3 opacity-30">◉</div>
          <div className="text-sm text-bay-400">No active alerts for the Mobile Bay area</div>
          <div className="text-xs text-bay-300 mt-1">NWS alerts are checked automatically every 15 minutes</div>
        </div>
      )}
    </div>
  )
}

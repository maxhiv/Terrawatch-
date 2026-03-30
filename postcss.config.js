import { useAnomalyStats } from "../hooks/useAnomalies";
import { useFeedStatus }   from "../hooks/useFeeds";

export default function Overview() {
  const { data: stats }  = useAnomalyStats();
  const { data: feedSt } = useFeedStatus();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time environmental monitoring dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Anomalies",  value: stats?.activeCount ?? "—",  color: "text-red-400"   },
          { label: "Feeds Live",        value: feedSt?.live ?? "—",        color: "text-green-400" },
          { label: "Critical Alerts",
            value: stats?.bySeverity?.find(s=>s.severity==="CRITICAL")?._count?.id ?? 0, color: "text-red-400" },
          { label: "Feeds Failing",     value: feedSt?.failing ?? "—",     color: "text-amber-400" },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4">
            <div className="text-xs text-slate-400 mb-1">{kpi.label}</div>
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent Anomalies</h2>
        {stats?.recent?.length ? (
          <div className="space-y-2">
            {stats.recent.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded bg-white/5">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  a.severity === "CRITICAL" ? "bg-red-900/50 text-red-400" :
                  a.severity === "HIGH"     ? "bg-orange-900/50 text-orange-400" : "bg-yellow-900/50 text-yellow-400"
                }`}>{a.severity}</span>
                <span className="text-sm text-slate-300 flex-1">{a.message}</span>
                <span className="text-xs text-slate-500">{new Date(a.occurredAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 text-center py-8">No active anomalies ✓</div>
        )}
      </div>
    </div>
  );
}

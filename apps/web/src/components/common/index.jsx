import clsx from 'clsx'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

function timeAgo(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg className={clsx('animate-spin', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function SkeletonCard({ className }) {
  return (
    <div className={clsx('tw-card', className)}>
      <div className="tw-skeleton h-3 w-20 mb-3" />
      <div className="tw-skeleton h-7 w-16 mb-2" />
      <div className="tw-skeleton h-2.5 w-24" />
    </div>
  )
}

export function SkeletonRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function PageHeader({ icon, title, subtitle, badge, actions }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          {icon && <span className="text-xl opacity-60">{icon}</span>}
          <h1 className="text-xl font-bold text-bay-800" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h1>
          {badge && (
            <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-teal-100/80 text-teal-700 border border-teal-200/60 font-bold backdrop-blur-sm">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <div className="text-xs text-bay-400">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, unit, color, icon, sub, alert, riskLevel, freshness, sparkData, sparkColor }) {
  const tintClass = alert ? 'tw-glass-tint-red'
    : riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'tw-glass-tint-red'
    : riskLevel === 'MODERATE' || riskLevel === 'ELEVATED' ? 'tw-glass-tint-amber'
    : riskLevel === 'LOW' ? 'tw-glass-tint-green'
    : ''

  return (
    <div className={clsx('tw-card transition-all hover:shadow-md hover:-translate-y-0.5', tintClass)}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-base opacity-50">{icon}</span>}
        <div className="tw-label flex-1">{label}</div>
        {freshness && (
          <span className="tw-mono text-[8px] text-bay-300 opacity-70">{timeAgo(freshness)}</span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <div className="tw-mono text-2xl font-bold mb-1" style={{ color: color || '#1a3028' }}>
            {value ?? '—'}
            {unit && <span className="text-xs font-normal text-bay-400 ml-1">{unit}</span>}
          </div>
          {sub && <div className="text-[10px] text-bay-300 leading-relaxed">{sub}</div>}
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="w-16 h-6 opacity-60 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={sparkColor || color || '#0a9e80'} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export function RiskBadge({ level, size = 'sm' }) {
  const colors = {
    LOW: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/60',
    MODERATE: 'bg-amber-100/80 text-amber-700 border-amber-200/60',
    HIGH: 'bg-orange-100/80 text-orange-700 border-orange-200/60',
    CRITICAL: 'bg-red-100/80 text-red-700 border-red-200/60',
    ELEVATED: 'bg-red-100/80 text-red-700 border-red-200/60',
  }
  const cls = colors[level] || colors.LOW
  return (
    <span className={clsx('tw-badge border font-bold backdrop-blur-sm', cls, size === 'lg' ? 'text-sm px-2 py-1' : '')}>
      {level || 'UNKNOWN'}
    </span>
  )
}

export function Section({ title, children, className }) {
  return (
    <div className={clsx('mb-5', className)}>
      {title && (
        <div className="tw-mono text-[9px] font-bold tracking-[0.15em] text-bay-400 uppercase mb-3">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

export function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-bay-300">
      {icon && <span className="text-3xl mb-2 opacity-40">{icon}</span>}
      <div className="text-sm">{message || 'No data available'}</div>
    </div>
  )
}

export function AlertBanner({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50/70 border-blue-200/60 text-blue-700 backdrop-blur-sm',
    warning: 'bg-amber-50/70 border-amber-200/60 text-amber-700 backdrop-blur-sm',
    error: 'bg-red-50/70 border-red-200/60 text-red-700 backdrop-blur-sm',
    success: 'bg-emerald-50/70 border-emerald-200/60 text-emerald-700 backdrop-blur-sm',
  }
  return (
    <div className={clsx('rounded-lg border p-3 mb-4 text-sm', styles[type] || styles.info)}>
      {children}
    </div>
  )
}

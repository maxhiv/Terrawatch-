import clsx from 'clsx'

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg className={clsx('animate-spin', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
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
            <span className="tw-mono text-[8px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-200 font-bold">
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

export function StatCard({ label, value, unit, color, icon, sub, alert }) {
  return (
    <div className={clsx('tw-card transition-shadow hover:shadow-md', alert && 'border-red-200')} style={alert ? { background: '#fef2f2' } : {}}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-base opacity-50">{icon}</span>}
        <div className="tw-label">{label}</div>
      </div>
      <div className="tw-mono text-2xl font-bold mb-1" style={{ color: color || '#1a3028' }}>
        {value}
        {unit && <span className="text-xs font-normal text-bay-400 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-[10px] text-bay-300 leading-relaxed">{sub}</div>}
    </div>
  )
}

export function RiskBadge({ level, size = 'sm' }) {
  const colors = {
    LOW: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    MODERATE: 'bg-amber-100 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    ELEVATED: 'bg-red-100 text-red-700 border-red-200',
  }
  const cls = colors[level] || colors.LOW
  return (
    <span className={clsx('tw-badge border font-bold', cls, size === 'lg' ? 'text-sm px-2 py-1' : '')}>
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
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }
  return (
    <div className={clsx('rounded-lg border p-3 mb-4 text-sm', styles[type] || styles.info)}>
      {children}
    </div>
  )
}

export default function Badge({ status, label, type }) {
  const classMap = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    neutral: 'badge-neutral',
    info: 'badge-info',
  }
  return (
    <span className={`badge ${classMap[type || status] || 'badge-neutral'}`}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
        backgroundColor: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          neutral: '#6b7280',
          info: '#3b82f6',
        }[type || status]
      }} />
      {label}
    </span>
  )
}

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'emerald' }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-900' },
    gold: { bg: 'bg-yellow-950', text: 'text-gold-400', border: 'border-yellow-900' },
    red: { bg: 'bg-red-950', text: 'text-red-400', border: 'border-red-900' },
    blue: { bg: 'bg-blue-950', text: 'text-blue-400', border: 'border-blue-900' },
  }
  const c = colorMap[color] || colorMap.emerald

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-inter uppercase tracking-wider mb-1">{title}</p>
          <p className="font-sora font-bold text-slate-900 text-2xl">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2 ${c.bg} border ${c.border}`}>
            <Icon size={18} className={c.text} />
          </div>
        )}
      </div>
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
          {trend !== undefined && (
            <span className={`text-xs font-inter font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
          {trendLabel && <span className="text-slate-500 text-xs font-inter">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}

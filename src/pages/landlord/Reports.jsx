import { useEffect, useState } from 'react'
import { TrendingUp, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate } from '../../lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 p-3">
        <p className="text-slate-900 text-sm font-sora font-bold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-emerald-400 text-xs font-inter mt-1">{formatCurrency(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function LandlordReports() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState({ monthly: [], summary: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        let paymentsQuery = supabase.from('payments').select('amount, created_at, status').eq('status', 'success')
        let invoicesQuery = supabase.from('invoices').select('amount, status, due_date')
        let propertiesQuery = supabase.from('properties').select('*', { count: 'exact', head: true })
        let leasesQuery = supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'actif')

        if (!isAdmin) {
          paymentsQuery = paymentsQuery.eq('owner_id', user.id)
          invoicesQuery = invoicesQuery.eq('owner_id', user.id)
          propertiesQuery = propertiesQuery.eq('owner_id', user.id)
          leasesQuery = leasesQuery.eq('owner_id', user.id)
        }

        const [
          { data: payments },
          { data: invoices },
          { count: properties },
          { count: leases },
        ] = await Promise.all([
          paymentsQuery,
          invoicesQuery,
          propertiesQuery,
          leasesQuery
        ])

        // Group by month
        const monthlyMap = {}
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        payments?.forEach(p => {
          const d = new Date(p.created_at)
          const key = `${months[d.getMonth()]} ${d.getFullYear()}`
          monthlyMap[key] = (monthlyMap[key] || 0) + p.amount
        })

        const monthly = Object.entries(monthlyMap).map(([month, total]) => ({ month, total })).slice(-6)

        const totalRevenue = payments?.reduce((a, p) => a + p.amount, 0) || 0
        const pendingAmount = invoices?.filter(i => i.status === 'en_attente' || i.status === 'en_retard').reduce((a, i) => a + i.amount, 0) || 0
        const overdueCount = invoices?.filter(i => i.status === 'en_retard').length || 0

        setData({
          monthly,
          summary: {
            totalRevenue,
            pendingAmount,
            overdueCount,
            properties: properties || 0,
            leases: leases || 0,
            avgRent: leases ? Math.round(totalRevenue / leases) : 0,
          },
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Rapports & Analyses</h1>
          <p className="section-subtitle">Vue financière de votre patrimoine</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Revenus totaux', value: formatCurrency(data.summary?.totalRevenue || 0), color: 'text-emerald-400' },
          { label: 'Loyers en attente', value: formatCurrency(data.summary?.pendingAmount || 0), color: 'text-gold-400' },
          { label: 'Impayés', value: `${data.summary?.overdueCount || 0} facture(s)`, color: 'text-red-400' },
          { label: 'Propriétés', value: data.summary?.properties || 0, color: 'text-slate-900' },
          { label: 'Baux actifs', value: data.summary?.leases || 0, color: 'text-slate-900' },
          { label: 'Revenu moyen/bail', value: formatCurrency(data.summary?.avgRent || 0), color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-sora font-black text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card">
        <h2 className="section-title mb-6">Revenus des 6 derniers mois</h2>
        {data.monthly.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-slate-500 text-sm font-inter">Aucune donnée disponible.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2e1a" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(5,150,105,0.05)' }} />
              <Bar dataKey="total" fill="#059669" radius={[0, 0, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

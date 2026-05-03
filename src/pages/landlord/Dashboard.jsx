import { useEffect, useState } from 'react'
import { Building2, Wallet, FileText, TrendingUp, Users, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, LEASE_STATUS } from '../../lib/utils'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'

export default function LandlordDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ properties: 0, leases: 0, pendingInvoices: 0, monthRevenue: 0 })
  const [recentLeases, setRecentLeases] = useState([])
  const [pendingInvoices, setPendingInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const [
          { count: properties },
          { count: leases },
          { data: invoices },
          { data: latestLeases },
        ] = await Promise.all([
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
          supabase.from('leases').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).eq('status', 'actif'),
          supabase.from('invoices').select('id, amount, status, due_date, lease_id, leases(properties(name))').eq('owner_id', user.id).in('status', ['en_attente', 'en_retard']).order('due_date').limit(5),
          supabase.from('leases').select('id, status, start_date, monthly_rent, properties(name, type), profiles(first_name, last_name)').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(5),
        ])

        const pending = invoices?.filter(i => i.status === 'en_attente' || i.status === 'en_retard') || []
        const monthRevenue = invoices?.filter(i => i.status === 'payee').reduce((a, i) => a + i.amount, 0) || 0

        setStats({ properties: properties || 0, leases: leases || 0, pendingInvoices: pending.length, monthRevenue })
        setPendingInvoices(invoices || [])
        setRecentLeases(latestLeases || [])
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
          <h1 className="section-title text-2xl">Tableau de bord</h1>
          <p className="section-subtitle">Vue d'ensemble de votre patrimoine</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mes propriétés" value={stats.properties} icon={Building2} color="emerald" />
        <StatCard title="Baux actifs" value={stats.leases} icon={Users} color="blue" />
        <StatCard title="Factures en attente" value={stats.pendingInvoices} icon={FileText} color="gold" />
        <StatCard title="Revenus du mois" value={formatCurrency(stats.monthRevenue)} icon={Wallet} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leases */}
        <div className="card">
          <h2 className="section-title mb-4">Baux récents</h2>
          {recentLeases.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText size={32} className="text-dark-600 mb-3" />
              <p className="text-slate-500 text-sm font-inter">Aucun bail créé.</p>
              <a href="/proprietaire/baux" className="text-emerald-400 text-sm mt-2 hover:underline">Créer un bail →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeases.map((lease) => (
                <div key={lease.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-slate-900 text-sm font-inter font-medium">{lease.properties?.name || '—'}</p>
                    <p className="text-slate-500 text-xs font-inter mt-0.5">
                      {lease.profiles?.first_name} {lease.profiles?.last_name} · {formatCurrency(lease.monthly_rent)}/mois
                    </p>
                  </div>
                  <Badge label={LEASE_STATUS[lease.status]?.label || lease.status} type={LEASE_STATUS[lease.status]?.color || 'neutral'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invoices */}
        <div className="card">
          <h2 className="section-title mb-4">Factures en attente</h2>
          {pendingInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 size={32} className="text-emerald-700 mb-3" />
              <p className="text-slate-500 text-sm font-inter">Tout est à jour !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-slate-900 text-sm font-inter font-medium">{inv.leases?.properties?.name || '—'}</p>
                    <p className="text-slate-500 text-xs font-inter mt-0.5">Échéance : {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold-400 font-sora font-bold text-sm">{formatCurrency(inv.amount)}</p>
                    <Badge label={inv.status === 'en_retard' ? 'En retard' : 'En attente'} type={inv.status === 'en_retard' ? 'danger' : 'warning'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

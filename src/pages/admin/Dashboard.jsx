import { useEffect, useState } from 'react'
import { Users, Building2, FileText, Wallet, TrendingUp, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/utils'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, properties: 0, leases: 0, revenue: 0, pendingPayments: 0 })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [
          { count: users },
          { count: properties },
          { count: leases },
          { data: payments },
          { data: latestUsers },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('properties').select('*', { count: 'exact', head: true }),
          supabase.from('leases').select('*', { count: 'exact', head: true }).eq('status', 'actif'),
          supabase.from('payments').select('amount, status').eq('status', 'success'),
          supabase.from('profiles').select('id, first_name, last_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
        ])

        const revenue = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0
        setStats({ users: users || 0, properties: properties || 0, leases: leases || 0, revenue, pendingPayments: 0 })
        setRecentUsers(latestUsers || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const roleLabels = { admin: { label: 'Admin', type: 'warning' }, proprietaire: { label: 'Propriétaire', type: 'success' }, locataire: { label: 'Locataire', type: 'info' } }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Tableau de bord Admin</h1>
          <p className="section-subtitle">Vue globale de la plateforme ImmoGest</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Utilisateurs" value={stats.users} icon={Users} color="emerald" trendLabel="inscrits" />
        <StatCard title="Propriétés" value={stats.properties} icon={Building2} color="blue" trendLabel="enregistrées" />
        <StatCard title="Baux actifs" value={stats.leases} icon={FileText} color="gold" trendLabel="en cours" />
        <StatCard title="Revenus totaux" value={formatCurrency(stats.revenue)} icon={Wallet} color="emerald" trendLabel="encaissés" />
      </div>

      {/* Recent users */}
      <div className="card">
        <h2 className="section-title mb-4">Derniers utilisateurs inscrits</h2>
        {recentUsers.length === 0 ? (
          <p className="text-slate-500 text-sm font-inter">Aucun utilisateur pour le moment.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="text-slate-900 font-medium">{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <Badge label={roleLabels[u.role]?.label || u.role} type={roleLabels[u.role]?.type || 'neutral'} />
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

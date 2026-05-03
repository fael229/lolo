import { useEffect, useState } from 'react'
import { Wallet, Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, formatRelative } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import { PAYMENT_STATUS } from '../../lib/moneroo'

export default function LandlordPayments() {
  const { user, isAdmin } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPayments = async () => {
    if (!user?.id) return
    setLoading(true)
    let query = supabase
      .from('payments')
      .select(`
        id, moneroo_payment_id, amount, status, payment_method, created_at,
        invoices(
          invoice_number, due_date,
          leases(
            properties(name),
            profiles!leases_tenant_id_fkey(first_name, last_name)
          )
        )
      `)
      .order('created_at', { ascending: false })
      
    if (!isAdmin) {
      query = query.eq('owner_id', user.id)
    }
    
    const { data } = await query
    setPayments(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPayments() }, [user?.id])

  const filtered = payments.filter((p) => {
    const inv = p.invoices
    const tenant = inv?.leases?.profiles
    return `${inv?.invoice_number} ${inv?.leases?.properties?.name} ${tenant?.first_name} ${tenant?.last_name}`.toLowerCase().includes(search.toLowerCase())
  })

  const statusIcon = { success: <CheckCircle size={14} className="text-emerald-400" />, failed: <XCircle size={14} className="text-red-400" />, pending: <Clock size={14} className="text-gold-400" /> }

  const totals = {
    success: payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Paiements reçus</h1>
          <p className="section-subtitle">{payments.length} transaction(s)</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input id="pay-search" className="input pl-9 w-52 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total encaissé</p>
          <p className="font-sora font-black text-emerald-400 text-2xl mt-1">{formatCurrency(totals.success)}</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-500 text-xs uppercase tracking-wider">En attente</p>
          <p className="font-sora font-black text-gold-400 text-2xl mt-1">{totals.pending}</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Échoués</p>
          <p className="font-sora font-black text-red-400 text-2xl mt-1">{totals.failed}</p>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16"><Wallet size={32} className="text-dark-600 mb-3" /><p className="text-slate-500 text-sm">Aucun paiement enregistré.</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Bien / Locataire</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pay) => {
                  const inv = pay.invoices
                  const tenant = inv?.leases?.profiles
                  const statusInfo = PAYMENT_STATUS[pay.status]
                  return (
                    <tr key={pay.id}>
                      <td className="font-mono text-xs text-slate-600">{inv?.invoice_number || '—'}</td>
                      <td>
                        <p className="text-slate-900 text-sm font-medium">{inv?.leases?.properties?.name || '—'}</p>
                        <p className="text-slate-500 text-xs">{tenant?.first_name} {tenant?.last_name}</p>
                      </td>
                      <td className="text-emerald-400 font-sora font-bold text-sm">{formatCurrency(pay.amount)}</td>
                      <td>
                        <span className="text-slate-600 text-xs uppercase">{pay.payment_method || '—'}</span>
                      </td>
                      <td>
                        <p className="text-slate-600 text-xs">{formatDate(pay.created_at)}</p>
                        <p className="text-slate-500 text-xs">{formatRelative(pay.created_at)}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {statusIcon[pay.status]}
                          <Badge label={statusInfo?.label || pay.status} type={statusInfo?.color || 'neutral'} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

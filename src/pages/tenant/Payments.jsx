import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, formatRelative } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import { PAYMENT_STATUS } from '../../lib/moneroo'

export default function TenantPayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('payments')
        .select(`
          id, moneroo_payment_id, amount, status, payment_method, created_at,
          invoices(invoice_number, period_label, leases(properties(name)))
        `)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false })
      setPayments(data || [])
      setLoading(false)
    }
    load()
  }, [user?.id])

  const statusIcon = {
    success: <CheckCircle2 size={14} className="text-emerald-400" />,
    failed: <XCircle size={14} className="text-red-400" />,
    pending: <Clock size={14} className="text-gold-400" />,
    initiated: <Clock size={14} className="text-blue-400" />,
  }

  const totalPaid = payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Mes paiements</h1>
          <p className="section-subtitle">{payments.length} transaction(s)</p>
        </div>
      </div>

      <div className="stat-card mb-6">
        <p className="text-slate-500 text-xs uppercase tracking-wider">Total payé</p>
        <p className="font-sora font-black text-emerald-400 text-3xl mt-1">{formatCurrency(totalPaid)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : payments.length === 0 ? (
        <div className="card flex flex-col items-center py-16">
          <Wallet size={32} className="text-dark-600 mb-3" />
          <p className="text-slate-500 text-sm font-inter">Aucune transaction effectuée.</p>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Bien</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => {
                  const statusInfo = PAYMENT_STATUS[pay.status]
                  return (
                    <tr key={pay.id}>
                      <td className="font-mono text-xs text-slate-500">{pay.invoices?.invoice_number || '—'}</td>
                      <td className="text-slate-900 text-sm">{pay.invoices?.leases?.properties?.name || '—'}</td>
                      <td className="text-emerald-400 font-sora font-bold text-sm">{formatCurrency(pay.amount)}</td>
                      <td className="text-slate-600 text-xs uppercase">{pay.payment_method || '—'}</td>
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
          </div>
        </div>
      )}
    </div>
  )
}

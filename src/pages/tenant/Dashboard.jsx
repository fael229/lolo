import { useEffect, useState } from 'react'
import { FileText, Wallet, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, formatDateFull, LEASE_STATUS, INVOICE_STATUS, isOverdue } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import { Link } from 'react-router-dom'

export default function TenantDashboard() {
  const { user, profile } = useAuth()
  const [lease, setLease] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const [{ data: leaseData }, { data: invData }] = await Promise.all([
          supabase.from('leases').select(`
            id, status, start_date, end_date, monthly_rent, payment_period, payment_day, deposit,
            properties(name, city, address, type),
            profiles!leases_owner_id_fkey(first_name, last_name, email, phone)
          `).eq('tenant_id', user.id).eq('status', 'actif').maybeSingle(),
          supabase.from('invoices').select('id, invoice_number, amount, status, due_date, period_label, description').eq('tenant_id', user.id).order('due_date', { ascending: false }).limit(5),
        ])
        setLease(leaseData)
        setInvoices(invData || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const pendingInvoices = invoices.filter(i => i.status === 'en_attente' || i.status === 'en_retard')
  const totalDue = pendingInvoices.reduce((a, i) => a + i.amount, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Bonjour, {profile?.first_name} 👋</h1>
          <p className="section-subtitle">Votre espace locataire ImmoGest</p>
        </div>
      </div>

      {!lease ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 bg-white border border-slate-200 flex items-center justify-center mb-4">
            <FileText size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-900 font-sora font-bold text-lg mb-2">Aucun bail actif</p>
          <p className="text-slate-500 text-sm font-inter max-w-sm">
            Votre propriétaire n'a pas encore créé de bail pour votre compte. Contactez-le pour qu'il vous assigne un bien.
          </p>
        </div>
      ) : (
        <>
          {/* Alert if dues */}
          {pendingInvoices.length > 0 && (
            <div className={`flex items-start gap-3 p-4 border ${pendingInvoices.some(i => i.status === 'en_retard') ? 'bg-red-950 border-red-900' : 'border-yellow-900 bg-yellow-950/50'}`} style={pendingInvoices.some(i => i.status === 'en_retard') ? {} : { backgroundColor: '#1c1400' }}>
              <AlertTriangle size={18} className={pendingInvoices.some(i => i.status === 'en_retard') ? 'text-red-400' : 'text-gold-400'} />
              <div>
                <p className={`font-sora font-bold text-sm ${pendingInvoices.some(i => i.status === 'en_retard') ? 'text-red-300' : 'text-gold-300'}`}>
                  {pendingInvoices.some(i => i.status === 'en_retard') ? 'Paiement en retard !' : 'Facture(s) en attente'}
                </p>
                <p className="text-slate-600 text-xs font-inter mt-0.5">
                  {pendingInvoices.length} facture(s) · Montant dû : <strong>{formatCurrency(totalDue)}</strong>
                </p>
                <Link to="/locataire/factures" className="text-emerald-400 text-xs hover:underline mt-1 inline-block">
                  Payer maintenant →
                </Link>
              </div>
            </div>
          )}

          {/* Lease card */}
          <div className="card">
            <div className="flex items-start justify-between mb-5">
              <h2 className="section-title">Mon bail actif</h2>
              <Badge label={LEASE_STATUS[lease.status]?.label} type={LEASE_STATUS[lease.status]?.color} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-inter mb-1">Bien loué</p>
                  <p className="text-slate-900 font-sora font-bold text-lg">{lease.properties?.name}</p>
                  <p className="text-slate-500 text-sm font-inter">{lease.properties?.address}, {lease.properties?.city}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-inter mb-1">Propriétaire</p>
                  <p className="text-slate-900 text-sm font-inter">{lease.profiles?.first_name} {lease.profiles?.last_name}</p>
                  <p className="text-slate-500 text-xs">{lease.profiles?.phone || lease.profiles?.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-inter mb-1">Loyer mensuel</p>
                  <p className="text-emerald-400 font-sora font-black text-3xl">{formatCurrency(lease.monthly_rent)}</p>
                  <p className="text-slate-500 text-xs font-inter">Échéance le {lease.payment_day} de chaque mois</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-inter mb-1">Début</p>
                    <p className="text-slate-900 text-sm font-inter">{formatDateFull(lease.start_date)}</p>
                  </div>
                  {lease.end_date && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider font-inter mb-1">Fin</p>
                      <p className="text-slate-900 text-sm font-inter">{formatDateFull(lease.end_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent invoices */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Dernières factures</h2>
              <Link to="/locataire/factures" className="text-emerald-400 text-sm hover:underline font-inter">Voir tout</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-slate-500 text-sm font-inter">Aucune facture pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div>
                      <p className="text-slate-900 text-sm font-inter font-medium">{inv.period_label || inv.description || inv.invoice_number}</p>
                      <p className="text-slate-500 text-xs font-inter mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Échéance : {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-sora font-bold text-sm">{formatCurrency(inv.amount)}</span>
                      <Badge label={INVOICE_STATUS[inv.status]?.label || inv.status} type={INVOICE_STATUS[inv.status]?.color || 'neutral'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Calendar, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, INVOICE_STATUS } from '../../lib/utils'
import { initializePayment, XOF_METHODS } from '../../lib/moneroo'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function TenantInvoices() {
  const { user, profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)
  const [methodModal, setMethodModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedMethods, setSelectedMethods] = useState([])
  const [error, setError] = useState(null)
  const [paymentError, setPaymentError] = useState(null)

  const fetchInvoices = async () => {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, amount, status, due_date, period_label, description,
        leases(
          properties(name, city),
          profiles!leases_owner_id_fkey(first_name, last_name)
        )
      `)
      .eq('tenant_id', user.id)
      .order('due_date', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchInvoices() }, [user?.id])

  const openPayment = (invoice) => {
    setSelectedInvoice(invoice)
    setSelectedMethods([])
    setPaymentError(null)
    setMethodModal(true)
  }

  const handlePay = async () => {
    if (!selectedInvoice || !profile) return
    setPaying(selectedInvoice.id)
    setPaymentError(null)
    try {
      const returnUrl = `${window.location.origin}/paiement/retour?invoiceId=${selectedInvoice.id}`
      const result = await initializePayment({
        amount: selectedInvoice.amount,
        description: `Loyer ${selectedInvoice.period_label || selectedInvoice.invoice_number}`,
        returnUrl,
        customer: {
          email: user.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
        },
        metadata: {
          invoice_id: selectedInvoice.id,
          invoice_number: selectedInvoice.invoice_number,
          tenant_id: user.id,
        },
        methods: selectedMethods,
      })

      // Save pending payment record
      await supabase.from('payments').insert({
        invoice_id: selectedInvoice.id,
        owner_id: selectedInvoice.leases?.owner_id,
        tenant_id: user.id,
        moneroo_payment_id: result.id,
        amount: selectedInvoice.amount,
        status: 'initiated',
        checkout_url: result.checkout_url,
      })

      // Update invoice status
      await supabase.from('invoices').update({ status: 'en_attente', moneroo_payment_id: result.id }).eq('id', selectedInvoice.id)

      // Redirect to Moneroo checkout
      window.location.href = result.checkout_url
    } catch (err) {
      setPaymentError(err.message || 'Erreur lors de l\'initialisation du paiement.')
    } finally {
      setPaying(null)
      setMethodModal(false)
    }
  }

  // XOF methods only
  const xofMethods = XOF_METHODS

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Mes factures</h1>
          <p className="section-subtitle">{invoices.length} facture(s)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : invoices.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <CheckCircle size={32} className="text-dark-600 mb-3" />
          <p className="text-slate-500 text-sm font-inter">Aucune facture pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isPending = inv.status === 'en_attente' || inv.status === 'en_retard'
            return (
              <div key={inv.id} className={`card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${inv.status === 'en_retard' ? 'border-red-900' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-500">{inv.invoice_number}</span>
                    <Badge label={INVOICE_STATUS[inv.status]?.label || inv.status} type={INVOICE_STATUS[inv.status]?.color || 'neutral'} />
                  </div>
                  <p className="text-slate-900 font-sora font-bold">{inv.period_label || inv.description}</p>
                  <p className="text-slate-500 text-xs font-inter mt-1 flex items-center gap-1">
                    <Calendar size={10} /> Échéance : {formatDate(inv.due_date)}
                  </p>
                  {inv.status === 'en_retard' && (
                    <p className="text-red-400 text-xs font-inter mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> Paiement en retard
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-emerald-400 font-sora font-black text-xl">{formatCurrency(inv.amount)}</p>
                  {isPending && (
                    <button
                      id={`pay-invoice-${inv.id}`}
                      onClick={() => openPayment(inv)}
                      disabled={paying === inv.id}
                      className="btn-gold text-sm"
                    >
                      <Smartphone size={14} />
                      {paying === inv.id ? 'Traitement…' : 'Payer maintenant'}
                    </button>
                  )}
                  {inv.status === 'payee' && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-inter">
                      <CheckCircle size={16} /> Payée
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payment Method Modal */}
      <Modal isOpen={methodModal} onClose={() => setMethodModal(false)} title="Choisir le mode de paiement" size="md">
        {selectedInvoice && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Montant à payer</p>
              <p className="text-emerald-400 font-sora font-black text-3xl">{formatCurrency(selectedInvoice.amount)}</p>
              <p className="text-slate-500 text-xs font-inter mt-1">{selectedInvoice.period_label || selectedInvoice.invoice_number}</p>
            </div>

            <div>
              <label className="input-label">Mode de paiement Mobile Money</label>
              <p className="text-slate-500 text-xs font-inter mb-3">Laissez vide pour voir tous les modes disponibles</p>
              <div className="grid grid-cols-2 gap-2">
                {xofMethods.map((m) => (
                  <button
                    key={m.code}
                    id={`method-${m.code}`}
                    type="button"
                    onClick={() => {
                      setSelectedMethods(prev =>
                        prev.includes(m.code) ? prev.filter(c => c !== m.code) : [...prev, m.code]
                      )
                    }}
                    className={`flex items-center gap-2 p-3 text-left border text-sm transition-all ${
                      selectedMethods.includes(m.code)
                        ? 'border-emerald-600 bg-emerald-950 text-slate-900'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="text-xs font-inter leading-tight">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-950 border border-red-900 text-red-400 text-sm font-inter">
                {paymentError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setMethodModal(false)} className="btn-secondary flex-1 justify-center">
                Annuler
              </button>
              <button
                id="confirm-payment-btn"
                onClick={handlePay}
                disabled={!!paying}
                className="btn-gold flex-1 justify-center"
              >
                {paying ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                    Redirection…
                  </span>
                ) : (
                  <>
                    <Smartphone size={14} />
                    Procéder au paiement
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

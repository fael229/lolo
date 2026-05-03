import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, Home, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { verifyPayment } from '../lib/moneroo'
import { formatCurrency } from '../lib/utils'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | failed | error
  const [amount, setAmount] = useState(null)
  const [invoiceNumber, setInvoiceNumber] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    const processReturn = async () => {
      const paymentId = searchParams.get('paymentId')
      const paymentStatus = searchParams.get('paymentStatus')
      const invoiceId = searchParams.get('invoiceId')

      if (!paymentId || !invoiceId) {
        setStatus('error')
        setErrorMsg('Paramètres de paiement manquants.')
        return
      }

      try {
        // Verify with Moneroo
        const txn = await verifyPayment(paymentId)

        if (txn.status === 'success') {
          // Update payment record
          await supabase
            .from('payments')
            .update({
              status: 'success',
              payment_method: txn.capture?.method?.short_code || null,
              moneroo_data: txn,
            })
            .eq('moneroo_payment_id', paymentId)

          // Mark invoice as paid
          await supabase
            .from('invoices')
            .update({ status: 'payee', paid_at: new Date().toISOString() })
            .eq('id', invoiceId)

          // Get invoice details for display
          const { data: inv } = await supabase
            .from('invoices')
            .select('invoice_number, amount')
            .eq('id', invoiceId)
            .single()

          setAmount(inv?.amount)
          setInvoiceNumber(inv?.invoice_number)
          setStatus('success')
        } else if (txn.status === 'failed' || txn.status === 'cancelled') {
          await supabase
            .from('payments')
            .update({ status: txn.status, moneroo_data: txn })
            .eq('moneroo_payment_id', paymentId)

          setStatus('failed')
          setErrorMsg(txn.capture?.failure_message || 'Le paiement a échoué ou a été annulé.')
        } else {
          setStatus('loading')
        }
      } catch (err) {
        setStatus('error')
        setErrorMsg(err.message || 'Erreur lors de la vérification du paiement.')
      }
    }

    processReturn()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-inter text-sm">Vérification du paiement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern bg-grid flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-emerald-950 border-2 border-emerald-700 flex items-center justify-center mx-auto mb-6 animate-fade-in">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h1 className="font-sora font-black text-slate-900 text-3xl mb-2">Paiement réussi !</h1>
            {amount && (
              <p className="text-emerald-400 font-sora font-bold text-2xl mb-2">{formatCurrency(amount)}</p>
            )}
            {invoiceNumber && (
              <p className="text-slate-500 font-inter text-sm mb-6">Facture {invoiceNumber} — réglée avec succès</p>
            )}
            <p className="text-slate-500 text-sm font-inter mb-8">
              Un reçu vous a été envoyé par email. Votre propriétaire sera notifié.
            </p>
            <Link to="/locataire" className="btn-primary inline-flex mx-auto">
              <Home size={16} /> Retour à l'accueil
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-950 border-2 border-red-800 flex items-center justify-center mx-auto mb-6 animate-fade-in">
              <XCircle size={40} className="text-red-400" />
            </div>
            <h1 className="font-sora font-black text-slate-900 text-3xl mb-2">
              {status === 'error' ? 'Erreur' : 'Paiement échoué'}
            </h1>
            <p className="text-slate-500 font-inter text-sm mb-6">
              {errorMsg || 'Une erreur est survenue lors du paiement.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/locataire/factures" className="btn-primary text-sm">
                <ArrowRight size={14} /> Réessayer
              </Link>
              <Link to="/locataire" className="btn-secondary text-sm">
                Retour
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

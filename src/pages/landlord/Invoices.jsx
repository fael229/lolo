import { useEffect, useState } from 'react'
import { Plus, Search, FileText, AlertCircle, Eye, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, generateInvoiceNumber, INVOICE_STATUS, isOverdue } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const initialForm = {
  lease_id: '',
  amount: '',
  due_date: '',
  description: '',
  period_label: '',
}

export default function LandlordInvoices() {
  const { user, isAdmin } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchAll = async () => {
    if (!user?.id) return
    setLoading(true)
    let invoicesQuery = supabase.from('invoices').select(`
      id, invoice_number, amount, status, due_date, period_label, description, created_at,
      leases(
        id, monthly_rent,
        properties(name, city),
        profiles!leases_tenant_id_fkey(first_name, last_name, email)
      )
    `).order('created_at', { ascending: false })
    
    let leasesQuery = supabase.from('leases').select(`
      id, monthly_rent,
      properties(name, city),
      profiles!leases_tenant_id_fkey(first_name, last_name)
    `).eq('status', 'actif')

    if (!isAdmin) {
      invoicesQuery = invoicesQuery.eq('owner_id', user.id)
      leasesQuery = leasesQuery.eq('owner_id', user.id)
    }

    const [
      { data: invData },
      { data: leasesData },
    ] = await Promise.all([
      invoicesQuery,
      leasesQuery
    ])

    // Auto-mark overdue
    const toUpdate = invData?.filter(i => i.status === 'en_attente' && isOverdue(i.due_date)).map(i => i.id)
    if (toUpdate?.length) {
      await supabase.from('invoices').update({ status: 'en_retard' }).in('id', toUpdate)
    }

    setInvoices(invData?.map(i => ({
      ...i,
      status: toUpdate?.includes(i.id) ? 'en_retard' : i.status,
    })) || [])
    setLeases(leasesData || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [user?.id])

  const filtered = invoices.filter((inv) => {
    const t = inv.leases?.profiles
    const matchSearch = `${inv.invoice_number} ${inv.leases?.properties?.name} ${t?.first_name} ${t?.last_name}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleLeaseSelect = (leaseId) => {
    const lease = leases.find(l => l.id === leaseId)
    setForm(f => ({ ...f, lease_id: leaseId, amount: lease?.monthly_rent || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.lease_id || !form.amount || !form.due_date) {
      setError('Veuillez remplir les champs obligatoires.'); return
    }
    setSaving(true); setError(null)
    const selectedLease = leases.find(l => l.id === form.lease_id)
    const payload = {
      invoice_number: generateInvoiceNumber(),
      lease_id: form.lease_id,
      owner_id: isAdmin ? selectedLease?.owner_id || user.id : user.id,
      amount: Number(form.amount),
      due_date: form.due_date,
      description: form.description || `Loyer — ${form.period_label}`,
      period_label: form.period_label,
      status: 'en_attente',
    }
    const { error: err } = await supabase.from('invoices').insert(payload)
    if (err) setError(err.message)
    else { setModalOpen(false); fetchAll() }
    setSaving(false)
  }

  const markPaid = async (id) => {
    await supabase.from('invoices').update({ status: 'payee' }).eq('id', id)
    fetchAll()
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Factures</h1>
          <p className="section-subtitle">{invoices.length} facture(s)</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="inv-search" className="input pl-9 w-48 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select id="inv-filter" className="select w-40 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(INVOICE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button id="add-invoice-btn" onClick={() => { setForm(initialForm); setError(null); setModalOpen(true) }} className="btn-primary text-sm">
            <Plus size={14} /> Nouvelle facture
          </button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16"><FileText size={32} className="text-dark-600 mb-3" /><p className="text-slate-500 text-sm">Aucune facture trouvée.</p></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Bien / Locataire</th>
                  <th>Montant</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const tenant = inv.leases?.profiles
                  return (
                    <tr key={inv.id}>
                      <td className="text-slate-900 font-mono text-xs">{inv.invoice_number}</td>
                      <td>
                        <p className="text-slate-900 text-sm font-medium">{inv.leases?.properties?.name}</p>
                        <p className="text-slate-500 text-xs">{tenant?.first_name} {tenant?.last_name}</p>
                      </td>
                      <td className="text-emerald-400 font-sora font-bold text-sm">{formatCurrency(inv.amount)}</td>
                      <td className={`text-sm font-inter ${inv.status === 'en_retard' ? 'text-red-400 font-semibold' : 'text-slate-600'}`}>
                        {formatDate(inv.due_date)}
                      </td>
                      <td>
                        <Badge label={INVOICE_STATUS[inv.status]?.label || inv.status} type={INVOICE_STATUS[inv.status]?.color || 'neutral'} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {(inv.status === 'en_attente' || inv.status === 'en_retard') && (
                            <button id={`mark-paid-${inv.id}`} onClick={() => markPaid(inv.id)} className="btn-ghost text-xs px-2 py-1 text-emerald-400 hover:bg-emerald-950">
                              ✓ Marquer payée
                            </button>
                          )}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle facture" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-900 text-red-400 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="input-label">Bail concerné *</label>
            <select className="select" value={form.lease_id} onChange={(e) => handleLeaseSelect(e.target.value)} required>
              <option value="">Sélectionner un bail…</option>
              {leases.map(l => (
                <option key={l.id} value={l.id}>
                  {l.properties?.name} — {l.profiles?.first_name} {l.profiles?.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Montant (XOF) *</label>
              <input className="input" type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required min="0" />
            </div>
            <div>
              <label className="input-label">Date d'échéance *</label>
              <input className="input" type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="input-label">Période (ex: Janvier 2026)</label>
            <input className="input" placeholder="Janvier 2026" value={form.period_label} onChange={(e) => setForm(f => ({ ...f, period_label: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Description</label>
            <input className="input" placeholder="Loyer mensuel…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Générer la facture'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

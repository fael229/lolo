import { useEffect, useState } from 'react'
import { Plus, Search, Calendar, AlertCircle, Edit2, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, PAYMENT_PERIODS, LEASE_STATUS } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import CreateUserModal from '../../components/ui/CreateUserModal'

const initialForm = {
  property_id: '',
  tenant_id: '',
  start_date: '',
  end_date: '',
  monthly_rent: '',
  payment_period: 'mensuel',
  payment_day: '5',
  deposit: '',
  notes: '',
  renewal_type: 'manuel',
  late_fee_type: 'aucun',
  late_fee_amount: '0',
  grace_period_days: '0',
}

export default function LandlordLeases() {
  const { user, isAdmin } = useAuth()
  const [leases, setLeases] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [editLease, setEditLease] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchAll = async () => {
    if (!user?.id) return
    setLoading(true)
    let leasesQuery = supabase.from('leases').select(`
      id, status, start_date, end_date, monthly_rent, payment_period, payment_day, deposit, notes, created_at,
      properties(id, name, city),
      profiles!leases_tenant_id_fkey(id, first_name, last_name, email, phone)
    `).order('created_at', { ascending: false })
    
    let propsQuery = supabase.from('properties').select('id, name, city, monthly_rent')
    
    if (!isAdmin) {
      leasesQuery = leasesQuery.eq('owner_id', user.id)
      propsQuery = propsQuery.eq('owner_id', user.id)
    }

    const [
      { data: leasesData },
      { data: propsData },
      { data: tenantsData },
    ] = await Promise.all([
      leasesQuery,
      propsQuery,
      supabase.from('profiles').select('id, first_name, last_name, email, phone').eq('role', 'locataire'),
    ])
    setLeases(leasesData || [])
    setProperties(propsData || [])
    setTenants(tenantsData || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [user?.id])

  const filtered = leases.filter((l) => {
    const t = l.profiles
    return `${l.properties?.name} ${t?.first_name} ${t?.last_name}`.toLowerCase().includes(search.toLowerCase())
  })

  const openCreate = () => {
    setEditLease(null); setForm(initialForm); setError(null); setModalOpen(true)
  }

  const handlePropertySelect = (propId) => {
    const prop = properties.find(p => p.id === propId)
    setForm(f => ({ ...f, property_id: propId, monthly_rent: prop?.monthly_rent || f.monthly_rent }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.property_id || !form.tenant_id || !form.start_date || !form.monthly_rent) {
      setError('Veuillez remplir tous les champs obligatoires.'); return
    }
    setSaving(true); setError(null)
    const payload = {
      property_id: form.property_id,
      tenant_id: form.tenant_id,
      owner_id: isAdmin ? properties.find(p => p.id === form.property_id)?.owner_id || user.id : user.id,
      start_date: form.start_date,
      end_date: form.end_date || null,
      monthly_rent: Number(form.monthly_rent),
      payment_period: form.payment_period,
      payment_day: Number(form.payment_day),
      deposit: form.deposit ? Number(form.deposit) : null,
      notes: form.notes || null,
      renewal_type: form.renewal_type,
      late_fee_type: form.late_fee_type,
      late_fee_amount: Number(form.late_fee_amount) || 0,
      grace_period_days: Number(form.grace_period_days) || 0,
      status: 'actif',
    }

    let err
    if (editLease) {
      ({ error: err } = await supabase.from('leases').update(payload).eq('id', editLease.id))
    } else {
      ({ error: err } = await supabase.from('leases').insert(payload))
    }
    if (err) setError(err.message)
    else { setModalOpen(false); fetchAll() }
    setSaving(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('leases').update({ status }).eq('id', id)
    fetchAll()
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Gestion des baux</h1>
          <p className="section-subtitle">{leases.length} bail(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="lease-search" className="input pl-9 w-52 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button id="add-lease-btn" onClick={openCreate} className="btn-primary text-sm">
            <Plus size={14} /> Nouveau bail
          </button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FileText size={32} className="text-dark-600 mb-3" />
              <p className="text-slate-500 text-sm font-inter">Aucun bail trouvé.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Locataire</th>
                  <th>Loyer</th>
                  <th>Période</th>
                  <th>Début</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lease) => {
                  const tenant = lease.profiles
                  return (
                    <tr key={lease.id}>
                      <td>
                        <p className="text-slate-900 font-medium text-sm">{lease.properties?.name}</p>
                        <p className="text-slate-500 text-xs">{lease.properties?.city}</p>
                      </td>
                      <td>
                        <p className="text-slate-900 text-sm">{tenant?.first_name} {tenant?.last_name}</p>
                        <p className="text-slate-500 text-xs">{tenant?.phone || tenant?.email}</p>
                      </td>
                      <td className="text-emerald-400 font-sora font-bold text-sm">{formatCurrency(lease.monthly_rent)}</td>
                      <td>
                        <span className="text-slate-600 text-xs capitalize">{lease.payment_period}</span>
                      </td>
                      <td className="text-slate-600 text-xs">{formatDate(lease.start_date)}</td>
                      <td>
                        <Badge label={LEASE_STATUS[lease.status]?.label || lease.status} type={LEASE_STATUS[lease.status]?.color || 'neutral'} />
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {lease.status === 'actif' && (
                            <button id={`terminate-lease-${lease.id}`} onClick={() => updateStatus(lease.id, 'termine')} className="btn-ghost text-xs px-2 py-1 text-red-400 hover:bg-red-950">
                              Terminer
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editLease ? 'Modifier le bail' : 'Nouveau bail'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-900 text-red-400 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Propriété *</label>
              <select className="select" value={form.property_id} onChange={(e) => handlePropertySelect(e.target.value)} required>
                <option value="">Sélectionner…</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="input-label flex items-center justify-between">
                Locataire *
                <button type="button" onClick={() => setCreateUserModalOpen(true)} className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold lowercase">
                  + Créer un locataire
                </button>
              </label>
              <select className="select" value={form.tenant_id} onChange={(e) => setForm(f => ({ ...f, tenant_id: e.target.value }))} required>
                <option value="">Sélectionner…</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.email})</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Date de début *</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Date de fin</label>
              <input className="input" type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Loyer mensuel (XOF) *</label>
              <input className="input" type="number" value={form.monthly_rent} onChange={(e) => setForm(f => ({ ...f, monthly_rent: e.target.value }))} required min="0" />
            </div>
            <div>
              <label className="input-label">Caution (XOF)</label>
              <input className="input" type="number" value={form.deposit} onChange={(e) => setForm(f => ({ ...f, deposit: e.target.value }))} min="0" />
            </div>
            <div>
              <label className="input-label">Périodicité du loyer</label>
              <select className="select" value={form.payment_period} onChange={(e) => setForm(f => ({ ...f, payment_period: e.target.value }))}>
                {PAYMENT_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Jour d'échéance (1-31)</label>
              <input className="input" type="number" min="1" max="31" value={form.payment_day} onChange={(e) => setForm(f => ({ ...f, payment_day: e.target.value }))} />
            </div>

            <div className="col-span-2 pt-4 mt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Automatisation & Pénalités</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Type de renouvellement</label>
                  <select className="select" value={form.renewal_type} onChange={(e) => setForm(f => ({ ...f, renewal_type: e.target.value }))}>
                    <option value="manuel">Manuel (doit être signé à nouveau)</option>
                    <option value="tacite">Tacite (automatique)</option>
                    <option value="aucun">Aucun (fin stricte)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Type de pénalité de retard</label>
                  <select className="select" value={form.late_fee_type} onChange={(e) => setForm(f => ({ ...f, late_fee_type: e.target.value }))}>
                    <option value="aucun">Aucune pénalité</option>
                    <option value="pourcentage">Pourcentage du loyer (%)</option>
                    <option value="fixe">Montant fixe (XOF)</option>
                  </select>
                </div>
                {form.late_fee_type !== 'aucun' && (
                  <>
                    <div>
                      <label className="input-label">
                        Valeur de la pénalité {form.late_fee_type === 'pourcentage' ? '(%)' : '(XOF)'}
                      </label>
                      <input className="input" type="number" min="0" value={form.late_fee_amount} onChange={(e) => setForm(f => ({ ...f, late_fee_amount: e.target.value }))} />
                    </div>
                    <div>
                      <label className="input-label">Délai de grâce (Jours)</label>
                      <input className="input" type="number" min="0" placeholder="Ex: 3" value={form.grace_period_days} onChange={(e) => setForm(f => ({ ...f, grace_period_days: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <label className="input-label">Notes</label>
              <textarea className="input resize-none" rows={3} placeholder="Conditions particulières…" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      <CreateUserModal 
        isOpen={createUserModalOpen} 
        onClose={() => setCreateUserModalOpen(false)} 
        defaultRole="locataire"
        onSuccess={(newUser) => {
          setCreateUserModalOpen(false)
          fetchAll() // refresh tenants list
        }}
      />
    </div>
  )
}

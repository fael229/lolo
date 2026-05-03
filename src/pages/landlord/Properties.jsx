import { useEffect, useState } from 'react'
import { Plus, Search, MapPin, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, PROPERTY_TYPES } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const initialForm = { name: '', type: 'appartement', address: '', city: '', description: '', monthly_rent: '', rooms: '', surface: '' }

export default function LandlordProperties() {
  const { user, isAdmin } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProp, setEditProp] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchProperties = async () => {
    if (!user?.id) return
    setLoading(true)
    let query = supabase.from('properties').select('*, leases(count)').order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('owner_id', user.id)
    const { data } = await query
    setProperties(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProperties() }, [user?.id])

  const filtered = properties.filter((p) =>
    `${p.name} ${p.city} ${p.address}`.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditProp(null); setForm(initialForm); setError(null); setModalOpen(true) }
  const openEdit = (p) => {
    setEditProp(p)
    setForm({ name: p.name, type: p.type, address: p.address, city: p.city, description: p.description || '', monthly_rent: p.monthly_rent, rooms: p.rooms || '', surface: p.surface || '' })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.address || !form.city || !form.monthly_rent) {
      setError('Veuillez remplir les champs obligatoires.'); return
    }
    setSaving(true); setError(null)
    const payload = { ...form, monthly_rent: Number(form.monthly_rent), rooms: form.rooms ? Number(form.rooms) : null, surface: form.surface ? Number(form.surface) : null, owner_id: user.id }

    let err
    if (editProp) {
      ({ error: err } = await supabase.from('properties').update(payload).eq('id', editProp.id))
    } else {
      ({ error: err } = await supabase.from('properties').insert(payload))
    }
    if (err) setError(err.message)
    else { setModalOpen(false); fetchProperties() }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette propriété ? Les baux associés seront conservés.')) return
    await supabase.from('properties').delete().eq('id', id)
    fetchProperties()
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Mes propriétés</h1>
          <p className="section-subtitle">{properties.length} bien(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="prop-search" className="input pl-9 w-52 text-sm" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button id="add-property-btn" onClick={openCreate} className="btn-primary text-sm">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-14 h-14 bg-white border border-slate-200 flex items-center justify-center mb-4"><MapPin size={24} className="text-slate-500" /></div>
          <p className="text-slate-900 font-sora font-bold mb-1">Aucune propriété</p>
          <p className="text-slate-500 text-sm font-inter mb-6">Ajoutez votre premier bien immobilier.</p>
          <button onClick={openCreate} className="btn-primary text-sm"><Plus size={14} /> Ajouter un bien</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card hover:border-emerald-900 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-sora font-bold text-base truncate">{p.name}</p>
                  <p className="text-slate-500 text-xs font-inter mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {p.address}, {p.city}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button id={`edit-prop-${p.id}`} onClick={() => openEdit(p)} className="btn-ghost p-1.5"><Edit2 size={13} /></button>
                  <button id={`del-prop-${p.id}`} onClick={() => handleDelete(p.id)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-950"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge label={PROPERTY_TYPES.find(t => t.value === p.type)?.label || p.type} type="neutral" />
                {p.rooms && <span className="text-slate-500 text-xs font-inter">{p.rooms} pièces</span>}
                {p.surface && <span className="text-slate-500 text-xs font-inter">{p.surface} m²</span>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-emerald-400 font-sora font-bold text-lg">{formatCurrency(p.monthly_rent)}</span>
                <span className="text-slate-500 text-xs font-inter">/mois</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProp ? 'Modifier la propriété' : 'Nouvelle propriété'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-900 text-red-400 text-sm font-inter">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="input-label">Nom du bien *</label>
              <input className="input" placeholder="Villa Rose, Appartement F3…" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Type *</label>
              <select className="select" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Loyer mensuel (XOF) *</label>
              <input className="input" type="number" placeholder="75000" value={form.monthly_rent} onChange={(e) => setForm(f => ({ ...f, monthly_rent: e.target.value }))} required min="0" />
            </div>
            <div>
              <label className="input-label">Adresse *</label>
              <input className="input" placeholder="Rue des Palmiers, N°12" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Ville *</label>
              <input className="input" placeholder="Cotonou" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} required />
            </div>
            <div>
              <label className="input-label">Nombre de pièces</label>
              <input className="input" type="number" placeholder="3" value={form.rooms} onChange={(e) => setForm(f => ({ ...f, rooms: e.target.value }))} min="1" />
            </div>
            <div>
              <label className="input-label">Surface (m²)</label>
              <input className="input" type="number" placeholder="65" value={form.surface} onChange={(e) => setForm(f => ({ ...f, surface: e.target.value }))} min="1" />
            </div>
            <div className="col-span-2">
              <label className="input-label">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Description du bien…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editProp ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

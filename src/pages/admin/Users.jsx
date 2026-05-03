import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, UserCog, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate, getInitials } from '../../lib/utils'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import CreateUserModal from '../../components/ui/CreateUserModal'

const ROLES = ['admin', 'proprietaire', 'locataire']
const roleColors = { admin: 'warning', proprietaire: 'success', locataire: 'info' }
const roleLabels = { admin: 'Administrateur', proprietaire: 'Propriétaire', locataire: 'Locataire' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = async (userId, newRole) => {
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) setError(error.message)
    else await fetchUsers()
    setSaving(false)
    setModalOpen(false)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="section-title text-2xl">Gestion des utilisateurs</h1>
          <p className="section-subtitle">{users.length} compte(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="user-search"
              className="input pl-9 w-64 text-sm"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setCreateUserModalOpen(true)} className="btn-primary text-sm">
            <Plus size={14} /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-900 text-red-400 text-sm font-inter">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="card p-0">
        <div className="table-container">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12 font-inter">Aucun utilisateur trouvé.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-emerald-900 flex items-center justify-center text-emerald-300 text-xs font-sora font-bold shrink-0">
                          {getInitials(u.first_name, u.last_name)}
                        </div>
                        <span className="text-slate-900 font-medium text-sm">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <Badge label={roleLabels[u.role] || u.role} type={roleColors[u.role] || 'neutral'} />
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <button
                        id={`change-role-${u.id}`}
                        onClick={() => { setEditUser(u); setModalOpen(true) }}
                        className="btn-ghost text-xs px-2 py-1"
                        title="Changer le rôle"
                      >
                        <UserCog size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role change modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditUser(null) }} title="Modifier le rôle">
        {editUser && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm font-inter">
              Utilisateur : <span className="text-slate-900 font-medium">{editUser.first_name} {editUser.last_name}</span>
            </p>
            <div>
              <label className="input-label">Nouveau rôle</label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(editUser.id, r)}
                    disabled={saving || editUser.role === r}
                    className={`w-full p-3 text-left border transition-all text-sm font-inter ${
                      editUser.role === r
                        ? 'border-emerald-600 bg-emerald-950 text-emerald-300 cursor-default'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {roleLabels[r]}
                    {editUser.role === r && <span className="ml-2 text-xs text-emerald-500">(actuel)</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <CreateUserModal 
        isOpen={createUserModalOpen} 
        onClose={() => setCreateUserModalOpen(false)} 
        onSuccess={() => {
          setCreateUserModalOpen(false)
          fetchUsers()
        }}
      />
    </div>
  )
}

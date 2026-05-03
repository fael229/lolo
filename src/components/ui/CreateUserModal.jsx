import { useState } from 'react'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '../../contexts/AuthContext'
import Modal from './Modal'

export default function CreateUserModal({ isOpen, onClose, defaultRole = 'locataire', onSuccess }) {
  const { isAdmin } = useAuth()
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: defaultRole,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    try {
      // Create a temporary client locally to avoid the global 'Multiple GoTrueClient instances' warning
      // and prevent logging out the current admin/owner
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }
        }
      )

      const { data, error } = await tempSupabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role,
            phone: form.phone,
          }
        }
      })

      if (error) throw error

      setSuccessMsg(`Utilisateur créé avec succès ! N'oubliez pas de lui transmettre ses identifiants : Email: ${form.email} / Mot de passe: ${form.password}`)
      
      // Call onSuccess after a delay to allow reading the message
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(data.user)
          handleClose()
        }, 5000)
      }
    } catch (err) {
      const msg = err.message?.includes('already registered')
        ? 'Cet email est déjà utilisé.'
        : err.message || 'Erreur lors de la création.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: defaultRole,
    })
    setSuccessMsg(null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un utilisateur">
      {successMsg ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <p className="text-slate-900 font-medium mb-2">Opération réussie</p>
          <p className="text-slate-600 text-sm font-inter">{successMsg}</p>
          <button onClick={handleClose} className="btn-primary mt-6">Fermer</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-inter">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Prénom *</label>
              <input name="firstName" type="text" value={form.firstName} onChange={handleChange} className="input" required />
            </div>
            <div>
              <label className="input-label">Nom *</label>
              <input name="lastName" type="text" value={form.lastName} onChange={handleChange} className="input" required />
            </div>
          </div>

          <div>
            <label className="input-label">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" required />
          </div>

          <div>
            <label className="input-label">Téléphone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="input" />
          </div>

          <div>
            <label className="input-label">Rôle *</label>
            <select name="role" value={form.role} onChange={handleChange} className="select" required>
              <option value="locataire">Locataire</option>
              {isAdmin && <option value="proprietaire">Propriétaire</option>}
              {isAdmin && <option value="admin">Administrateur</option>}
            </select>
          </div>

          <div>
            <label className="input-label">Mot de passe provisoire *</label>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="input pr-10"
                required
                placeholder="Ex: Temp@2026"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vous devrez transmettre ce mot de passe à l'utilisateur.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleClose} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

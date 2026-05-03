import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Home, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLES = [
  { value: 'proprietaire', label: 'Propriétaire', desc: 'Je publie et gère des biens' }
]

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'proprietaire',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return 'Veuillez remplir tous les champs obligatoires.'
    }
    if (form.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.'
    }
    if (form.password !== form.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)
    try {
      await signUp({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone,
      })
      setSuccess(true)
    } catch (err) {
      const msg = err.message?.includes('already registered')
        ? 'Cet email est déjà utilisé.'
        : err.message || 'Erreur lors de l\'inscription.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-sora font-black text-slate-900 text-3xl mb-3">Compte créé !</h1>
          <p className="text-slate-500 font-inter mb-2">
            Vérifiez votre boîte email pour confirmer votre inscription.
          </p>
          <p className="text-slate-500 font-inter text-sm mb-8">
            Un lien de confirmation vous a été envoyé à <span className="text-emerald-400">{form.email}</span>
          </p>
          <Link to="/connexion" className="btn-primary inline-flex">
            Aller à la connexion
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern bg-grid flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center">
            <Home size={16} className="text-slate-900" />
          </div>
          <span className="font-sora font-bold text-slate-900">ImmoGest</span>
        </Link>

        <div className="mb-8">
          <h1 className="font-sora font-black text-slate-900 text-3xl mb-2">Créer un compte</h1>
          <p className="text-slate-500 font-inter text-sm">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-950 border border-red-900 mb-6 animate-fade-in">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-sm font-inter">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Role selector - removed since only landlords can register */}
          <input type="hidden" name="role" value={form.role} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-firstName" className="input-label">Prénom *</label>
              <input id="reg-firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} className="input" placeholder="Kofi" required />
            </div>
            <div>
              <label htmlFor="reg-lastName" className="input-label">Nom *</label>
              <input id="reg-lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} className="input" placeholder="Mensah" required />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="input-label">Email *</label>
            <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="kofi@email.com" required />
          </div>

          <div>
            <label htmlFor="reg-phone" className="input-label">Téléphone (optionnel)</label>
            <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="input" placeholder="+229 97 00 00 00" />
          </div>

          <div>
            <label htmlFor="reg-password" className="input-label">Mot de passe *</label>
            <div className="relative">
              <input
                id="reg-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="input pr-12"
                placeholder="Min. 8 caractères"
                required
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm" className="input-label">Confirmer le mot de passe *</label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3.5 text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Création du compte…
              </span>
            ) : (
              <>
                Créer mon compte
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

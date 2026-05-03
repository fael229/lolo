import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Home, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { user, session } = await signIn(form.email, form.password)
      // Redirect based on session user metadata or wait for profile load
      // Navigation handled by PublicRoute after profile loads
    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : err.message || 'Erreur de connexion.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern bg-grid flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-100 border-r border-slate-200 p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center">
            <Home size={16} className="text-slate-900" />
          </div>
          <span className="font-sora font-bold text-slate-900">ImmoGest</span>
        </Link>

        <div>
          <h2 className="font-sora font-black text-slate-900 text-5xl leading-tight mb-6">
            Votre patrimoine,<br />
            <span className="text-emerald-500">sous contrôle.</span>
          </h2>
          <p className="text-slate-500 font-inter text-lg leading-relaxed max-w-md">
            Gérez vos biens immobiliers, vos locataires et vos paiements
            Mobile Money depuis une seule interface.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 border border-emerald-900 bg-emerald-950">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-emerald-400 text-sm font-inter">
            98% des paiements reçus dans les 24h
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center">
              <Home size={16} className="text-slate-900" />
            </div>
            <span className="font-sora font-bold text-slate-900">ImmoGest</span>
          </Link>

          <div className="mb-8">
            <h1 className="font-sora font-black text-slate-900 text-3xl mb-2">Connexion</h1>
            <p className="text-slate-500 font-inter text-sm">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                S'inscrire gratuitement
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
            <div>
              <label htmlFor="login-email" className="input-label">Adresse email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="input-label mb-0">Mot de passe</label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion…
                </span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

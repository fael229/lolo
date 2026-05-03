import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-inter">Chargement…</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />
  return children
}

export function RoleRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />

  if (roles && !roles.includes(profile?.role)) {
    const redirectMap = {
      admin: '/admin',
      proprietaire: '/proprietaire',
      locataire: '/locataire',
    }
    const redirect = redirectMap[profile?.role] || '/connexion'
    return <Navigate to={redirect} replace />
  }

  return children
}

export function PublicRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (user && profile?.role) {
    const redirectMap = {
      admin: '/admin',
      proprietaire: '/proprietaire',
      locataire: '/locataire',
    }
    return <Navigate to={redirectMap[profile.role] || '/'} replace />
  }

  return children
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null
    
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      
      if (error) {
        console.error('[Auth] Erreur chargement profil:', error.message)
        return null
      }
      return data
    } catch (err) {
      console.error('[Auth] Erreur fatale fetchProfile:', err.message)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // 1. Vérification initiale de la session
    const checkInitialSession = async () => {
      try {
        console.log('[Auth] Vérification initiale de la session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            console.log('[Auth] Session trouvée:', session.user.email)
            const p = await fetchProfile(session.user.id)
            setProfile(p)
          } else {
            console.log('[Auth] Aucune session trouvée au démarrage')
            setUser(null)
            setProfile(null)
          }
        }
      } catch (err) {
        console.error('[Auth] Erreur initialisation:', err.message)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    checkInitialSession()

    // 2. Écouteur des changements d'état d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Nouvel événement auth:', event)
      
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        
        // On récupère le profil si l'utilisateur change ou se connecte
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        }
      } else {
        setUser(null)
        setProfile(null)
      }

      // Pour être sûr que le chargement s'arrête sur n'importe quel événement initial
      if (mounted) setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email, password) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async ({ email, password, firstName, lastName, role = 'locataire', phone }) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, role, phone },
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates) => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const refreshProfile = async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      error,
      role: profile?.role || null,
      isAdmin: profile?.role === 'admin',
      isLandlord: profile?.role === 'proprietaire',
      isTenant: profile?.role === 'locataire',
      signIn,
      signUp,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider')
  return ctx
}

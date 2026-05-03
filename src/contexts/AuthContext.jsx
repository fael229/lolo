import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null
    
    try {
      // Add a 15 second timeout to prevent infinite loading if DB hangs
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching profile')), 15000))
      const profilePromise = supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error) {
        console.error('[Auth] Erreur chargement profil:', error.message)
        return null
      }
      console.log('[Auth] Profil chargé avec succès:', data?.email)
      return data
    } catch (err) {
      console.error('[Auth] Timeout ou erreur fatale:', err.message)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      try {
        console.log('[Auth] initSession démarré')
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getting session')), 15000))
        const sessionPromise = supabase.auth.getSession()
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        if (error) throw error
        
        console.log('[Auth] Session récupérée:', session?.user?.email || 'Aucune')
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          console.log('[Auth] Appel de fetchProfile depuis initSession')
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        }
      } catch (err) {
        console.error('[Auth] Erreur initSession:', err.message)
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange event:', event)
      if (!mounted) return

      // Prevent race condition with getSession on initial load
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_OUT') {
        console.log('[Auth] Utilisateur déconnecté')
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        
        // Only fetch profile on explicit SIGNED_IN event.
        if (event === 'SIGNED_IN') {
          console.log('[Auth] Appel de fetchProfile depuis SIGNED_IN')
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      if (mounted) setLoading(false)
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
      loading,
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

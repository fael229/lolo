import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans .env')
}

// Cache l'instance globalement pour éviter les recréations lors du Hot Module Replacement (HMR) avec Vite
// Cela empêche le bug de "chargement infini" dû aux verrous (locks) de session abandonnés
let client

if (!window.__SUPABASE_CLIENT__) {
  window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

client = window.__SUPABASE_CLIENT__

export const supabase = client

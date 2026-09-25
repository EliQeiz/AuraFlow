import { firebaseConfigured } from './firebase'
import { supabaseConfigured } from './supabase'

export type BackendProvider = 'firebase' | 'supabase'

// Keep Firebase active during the staged cutover. Supabase is selected only
// when an environment explicitly opts into the completed replacement.
export const backendProvider: BackendProvider =
  import.meta.env.VITE_BACKEND_PROVIDER === 'supabase' ? 'supabase' : 'firebase'

export const backendConfigured =
  backendProvider === 'supabase' ? supabaseConfigured : firebaseConfigured

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim()

export const supabaseConfigured = Boolean(url && publishableKey)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, publishableKey as string, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured for this environment.')
  }
  return supabase
}

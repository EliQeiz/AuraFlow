export type ServerBackendProvider = 'firebase' | 'supabase'

// Server routes do not infer their provider from browser configuration. This
// prevents a public Vite variable from changing trusted API behavior.
export const serverBackendProvider: ServerBackendProvider =
  process.env.AURAFLOW_BACKEND_PROVIDER === 'supabase' ? 'supabase' : 'firebase'

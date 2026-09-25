import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_BACKEND_UNCONFIGURED')
  }

  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}

export async function requireSupabaseActor(authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new Error('UNAUTHENTICATED')

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('UNAUTHENTICATED')

  const { data: role, error: roleError } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (roleError) throw new Error('ROLE_LOOKUP_FAILED')

  return { uid: data.user.id, admin: role?.role === 'admin' }
}

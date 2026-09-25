import { getFirebaseAuth } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'

export async function businessApi<T>(command: Record<string, unknown>): Promise<T> {
  const token = backendProvider === 'supabase'
    ? (await getSupabase().auth.getSession()).data.session?.access_token
    : await getFirebaseAuth().currentUser?.getIdToken()
  const response = await fetch('/api/business', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(command), signal: AbortSignal.timeout(25_000) })
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Business services are not running. Please contact AuraFlow.')
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'The business request could not be completed.')
  return result as T
}

import { createHash } from 'node:crypto'
import { ZodError } from 'zod'
import type { ApiRequest, ApiResponse } from '../server/http.js'
import { serverBackendProvider } from '../server/backend.js'
import { BusinessError } from '../server/errors.js'
import { getSupabaseAdmin, requireSupabaseActor } from '../server/supabase.js'
import { businessCenterCommand } from '../server/business-center/supabase-service.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).json({ message: 'Method not allowed.' }); return }
  try {
    if (serverBackendProvider !== 'supabase') throw new BusinessError(503, 'Business Center is being prepared. Please try again shortly.')
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw new BusinessError(415, 'JSON is required.')
    if (JSON.stringify(req.body ?? '').length > 128_000) throw new BusinessError(413, 'Request is too large.')
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const token = String(req.headers.authorization || '').match(/^Bearer (.+)$/)?.[1]
    let actor = null
    if (token) {
      try { actor = await requireSupabaseActor(`Bearer ${token}`) } catch { throw new BusinessError(401, 'Your session expired. Sign in again.') }
    }
    const forwarded = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim()
    const subject = actor?.uid ?? createHash('sha256').update(forwarded).digest('hex')
    res.status(200).json(await businessCenterCommand(getSupabaseAdmin(), actor, body, subject))
  } catch (error) {
    if (error instanceof BusinessError) res.status(error.status).json({ message: error.message })
    else if (error instanceof ZodError || error instanceof SyntaxError) res.status(400).json({ message: error instanceof ZodError ? error.issues[0]?.message : 'Invalid JSON.' })
    else { console.error('business_center_api_failure', error instanceof Error ? error.name : 'unknown'); res.status(503).json({ message: 'Business Center is unavailable. Please try again later.' }) }
  }
}

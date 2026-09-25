import { createHash } from 'node:crypto'
import { ZodError } from 'zod'
import type { ApiRequest, ApiResponse } from '../server/http.js'
import { BusinessError } from '../server/errors.js'
import { businessServices } from '../server/business/firebase.js'
import { serverBackendProvider } from '../server/backend.js'
import { getSupabaseAdmin, requireSupabaseActor } from '../server/supabase.js'
import { businessCommand, publicBusiness } from '../server/business/service.js'
import { supabaseBusinessCommand, supabasePublicBusiness } from '../server/business/supabase-service.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ message: 'Method not allowed.' })
    return
  }
  try {
    if (
      !String(req.headers['content-type'] || '').startsWith('application/json')
    )
      throw new BusinessError(415, 'JSON is required.')
    if (JSON.stringify(req.body || '').length > 128_000)
      throw new BusinessError(413, 'Request is too large.')
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (body?.action === 'public') {
      if (serverBackendProvider === 'supabase') res.status(200).json(await supabasePublicBusiness(getSupabaseAdmin(), body.id))
      else res.status(200).json(await publicBusiness(businessServices().db, body.id))
      return
    }
    const token = String(req.headers.authorization || '').match(
      /^Bearer (.+)$/,
    )?.[1]
    if (!token) throw new BusinessError(401, 'Sign in to continue.')
    if (serverBackendProvider === 'supabase') {
      let actor
      try { actor = await requireSupabaseActor(`Bearer ${token}`) } catch { throw new BusinessError(401, 'Your session expired. Sign in again.') }
      const db = getSupabaseAdmin()
      const { data: accepted, error: quotaError } = await db.rpc('consume_api_rate_limit', {
        p_scope: 'business', p_subject_hash: createHash('sha256').update(actor.uid).digest('hex'), p_max_requests: 120,
      })
      if (quotaError) throw new BusinessError(503, 'Business protection services are unavailable.')
      if (accepted !== true) throw new BusinessError(429, 'Too many requests. Please wait a minute.')
      res.status(200).json(await supabaseBusinessCommand(db, actor, body))
      return
    }
    const { db, auth } = businessServices()
    let decoded
    try {
      decoded = await auth.verifyIdToken(token, true)
    } catch {
      throw new BusinessError(401, 'Your session expired. Sign in again.')
    }
    const quota = db.doc(
      `businessApiQuota/${createHash('sha256').update(decoded.uid).digest('hex')}`,
    )
    await db.runTransaction(async (tx) => {
      const data = (await tx.get(quota)).data(),
        minute = Math.floor(Date.now() / 60_000)
      const count = data?.minute === minute ? Number(data.count) : 0
      if (count >= 120)
        throw new BusinessError(429, 'Too many requests. Please wait a minute.')
      tx.set(quota, { minute, count: count + 1 })
    })
    res
      .status(200)
      .json(
        await businessCommand(
          db,
          { uid: decoded.uid, admin: decoded.admin === true },
          body,
        ),
      )
  } catch (error) {
    if (error instanceof BusinessError)
      res.status(error.status).json({ message: error.message })
    else if (error instanceof ZodError || error instanceof SyntaxError)
      res.status(400).json({
        message:
          error instanceof ZodError
            ? error.issues[0]?.message
            : 'Invalid JSON.',
      })
    else {
      console.error(
        'business_api_failure',
        error instanceof Error ? error.name : 'unknown',
      )
      res.status(503).json({
        message:
          'Business services are unavailable. Contact AuraFlow or try again later.',
      })
    }
  }
}

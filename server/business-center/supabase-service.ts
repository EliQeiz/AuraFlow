import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { demoBookingSchema, provisioningRequestSchema, requestStates, tenantPlans, type BusinessCenterRequest } from '../../src/domain/business-center.js'
import { BusinessError, type Actor } from '../errors.js'

const uuid = z.string().uuid()
const adminStateSchema = z.object({ action: z.literal('advance'), id: uuid, status: z.enum(requestStates), note: z.string().trim().max(6000).default('') }).strict()
const provisionSchema = z.object({ action: z.literal('provision'), id: uuid, tenantSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,62}$/), plan: z.enum(tenantPlans) }).strict()
const lifecycleSchema = z.object({ action: z.literal('tenant-lifecycle'), tenantId: uuid, lifecycle: z.enum(['ready', 'active', 'suspended', 'archived']), note: z.string().trim().min(2).max(2000) }).strict()
const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('book-demo'), payload: demoBookingSchema }).strict(),
  z.object({ action: z.literal('list') }).strict(),
  z.object({ action: z.literal('request-provisioning'), payload: provisioningRequestSchema }).strict(),
  adminStateSchema, provisionSchema, lifecycleSchema,
])

type RawRequest = {
  id: string; requested_by: string; school_name: string; preferred_slug: string; school_type: string; student_band: string; staff_band: string; curriculum: string
  launch_target: string | null; requested_modules: unknown; branding: unknown; notes: string; status: BusinessCenterRequest['status']; admin_note: string
  tenant_id: string | null; created_at: string; updated_at: string
}

function requestShape(row: RawRequest, detail?: { lifecycle?: string; hostname?: string; email?: string }): BusinessCenterRequest {
  return {
    id: row.id, schoolName: row.school_name, preferredSlug: row.preferred_slug, schoolType: row.school_type,
    studentBand: row.student_band, staffBand: row.staff_band, curriculum: row.curriculum, launchTarget: row.launch_target ?? undefined,
    requestedModules: Array.isArray(row.requested_modules) ? row.requested_modules.filter((value): value is string => typeof value === 'string') : [],
    branding: typeof row.branding === 'object' && row.branding ? row.branding as BusinessCenterRequest['branding'] : {}, notes: row.notes,
    status: row.status, adminNote: row.admin_note, tenantId: row.tenant_id ?? undefined, tenantLifecycle: detail?.lifecycle, hostname: detail?.hostname,
    ownerEmail: detail?.email, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

function assertAdmin(actor: Actor) {
  if (!actor.admin) throw new BusinessError(403, 'Only AuraFlow administrators can manage tenant provisioning.')
}

function canAdvance(from: BusinessCenterRequest['status'], to: BusinessCenterRequest['status']) {
  const allowed: Record<BusinessCenterRequest['status'], BusinessCenterRequest['status'][]> = {
    submitted: ['discovery', 'approved', 'declined', 'cancelled'], discovery: ['approved', 'declined', 'cancelled'],
    approved: ['provisioning', 'declined'], provisioning: ['ready'], ready: [], declined: [], cancelled: [],
  }
  return allowed[from].includes(to)
}

async function writeEvent(db: SupabaseClient, requestId: string, actorId: string, eventType: string, detail: string, tenantId?: string | null) {
  const { error } = await db.from('business_center_provisioning_events').insert({ request_id: requestId, actor_id: actorId, tenant_id: tenantId ?? null, event_type: eventType, detail })
  if (error) throw new BusinessError(503, 'Provisioning audit services are unavailable.')
}

async function listRequests(db: SupabaseClient, actor: Actor) {
  let query = db.from('business_center_provisioning_requests').select('*').order('updated_at', { ascending: false }).limit(actor.admin ? 250 : 100)
  if (!actor.admin) query = query.eq('requested_by', actor.uid)
  const { data, error } = await query
  if (error) throw new BusinessError(503, 'Business Center is unavailable.')
  const rows = (data ?? []) as RawRequest[]
  if (!rows.length) return []
  const requesters = [...new Set(rows.map((row) => row.requested_by))]
  const tenantIds = rows.flatMap((row) => row.tenant_id ? [row.tenant_id] : [])
  const [profiles, tenants, domains] = await Promise.all([
    actor.admin ? db.from('profiles').select('id,email').in('id', requesters) : Promise.resolve({ data: [] as { id: string; email: string }[], error: null }),
    tenantIds.length ? db.from('business_center_tenants').select('id,lifecycle').in('id', tenantIds) : Promise.resolve({ data: [] as { id: string; lifecycle: string }[], error: null }),
    tenantIds.length ? db.from('business_center_tenant_domains').select('tenant_id,hostname').in('tenant_id', tenantIds).eq('domain_type', 'subdomain') : Promise.resolve({ data: [] as { tenant_id: string; hostname: string }[], error: null }),
  ])
  if (profiles.error || tenants.error || domains.error) throw new BusinessError(503, 'Business Center details are unavailable.')
  const emailById = new Map((profiles.data ?? []).map((row) => [row.id, row.email]))
  const tenantById = new Map((tenants.data ?? []).map((row) => [row.id, row.lifecycle]))
  const domainByTenant = new Map((domains.data ?? []).map((row) => [row.tenant_id, row.hostname]))
  return rows.map((row) => requestShape(row, { email: emailById.get(row.requested_by), lifecycle: row.tenant_id ? tenantById.get(row.tenant_id) : undefined, hostname: row.tenant_id ? domainByTenant.get(row.tenant_id) : undefined }))
}

export async function businessCenterCommand(db: SupabaseClient, actor: Actor | null, raw: unknown, subject: string) {
  const command = commandSchema.parse(raw)
  const quotaHash = createHash('sha256').update(subject).digest('hex')
  const { data: accepted, error: quotaError } = await db.rpc('consume_api_rate_limit', { p_scope: command.action === 'book-demo' ? 'business-center-demo' : 'business-center', p_subject_hash: quotaHash, p_max_requests: command.action === 'book-demo' ? 6 : 100 })
  if (quotaError) throw new BusinessError(503, 'Business Center protection services are unavailable.')
  if (accepted !== true) throw new BusinessError(429, 'Too many requests. Please wait a minute.')
  if (command.action === 'book-demo') {
    const { error } = await db.from('business_center_leads').insert({ full_name: command.payload.fullName, email: command.payload.email, phone: command.payload.phone || null, school_name: command.payload.schoolName, role_title: command.payload.roleTitle, student_band: command.payload.studentBand, message: command.payload.message })
    if (error) throw new BusinessError(503, 'We could not save your demo request. Please try again.')
    return { saved: true }
  }
  if (!actor) throw new BusinessError(401, 'Sign in to continue.')
  if (command.action === 'list') return listRequests(db, actor)
  if (command.action === 'request-provisioning') {
    const { data, error } = await db.from('business_center_provisioning_requests').insert({
      requested_by: actor.uid, school_name: command.payload.schoolName, preferred_slug: command.payload.preferredSlug,
      school_type: command.payload.schoolType, student_band: command.payload.studentBand, staff_band: command.payload.staffBand,
      curriculum: command.payload.curriculum, launch_target: command.payload.launchTarget || null, requested_modules: command.payload.requestedModules,
      branding: command.payload.branding, notes: command.payload.notes,
    }).select('*').single()
    if (error || !data) {
      if (error?.code === '23505') throw new BusinessError(409, 'That request already has a tenant. Open the existing workspace instead.')
      throw new BusinessError(503, 'We could not start your school setup.')
    }
    await writeEvent(db, data.id, actor.uid, 'request-submitted', 'School provisioning request submitted for AuraFlow review.')
    return requestShape(data as RawRequest)
  }
  assertAdmin(actor)
  if (command.action === 'advance') {
    const { data: current, error: currentError } = await db.from('business_center_provisioning_requests').select('*').eq('id', command.id).maybeSingle()
    if (currentError || !current) throw new BusinessError(404, 'Provisioning request not found.')
    if (!canAdvance((current as RawRequest).status, command.status)) throw new BusinessError(409, 'That provisioning state transition is not allowed.')
    const { error } = await db.from('business_center_provisioning_requests').update({ status: command.status, admin_note: command.note, reviewed_by: actor.uid }).eq('id', command.id)
    if (error) throw new BusinessError(503, 'We could not update this request.')
    await writeEvent(db, command.id, actor.uid, `request-${command.status}`, command.note || `Request moved to ${command.status}.`, (current as RawRequest).tenant_id)
    return { saved: true }
  }
  if (command.action === 'provision') {
    const baseDomain = process.env.AURAFLOW_TENANT_BASE_DOMAIN?.trim().toLowerCase()
    if (!baseDomain) throw new BusinessError(409, 'Set AURAFLOW_TENANT_BASE_DOMAIN before provisioning a customer URL.')
    const { data, error } = await db.rpc('provision_business_center_school', { p_request_id: command.id, p_tenant_slug: command.tenantSlug, p_plan: command.plan, p_base_domain: baseDomain, p_actor_id: actor.uid })
    if (error || !data) {
      if (error?.code === '23505') throw new BusinessError(409, 'That tenant slug is already reserved.')
      throw new BusinessError(503, 'Tenant provisioning could not be completed.')
    }
    return { tenantId: data as string }
  }
  const { error } = await db.rpc('advance_business_center_tenant', { p_tenant_id: command.tenantId, p_lifecycle: command.lifecycle, p_note: command.note, p_actor_id: actor.uid })
  if (error) throw new BusinessError(503, 'Tenant lifecycle could not be updated.')
  return { saved: true }
}

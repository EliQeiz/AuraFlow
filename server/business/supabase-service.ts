import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  attendanceSchema,
  businessIdSchema,
  businessSettingsSchema,
  canTransitionOrder,
  initialBusinessSettings,
  orderInputSchema,
  orderStates,
  priceOrder,
  studentSchema,
  type Business,
  type BusinessSettings,
  type Order,
} from '../../src/domain/business.js'
import { BusinessError, type Actor } from '../errors.js'
import { sendSupabaseOrderNotification, supabaseWhatsAppConfigured } from './supabase-whatsapp.js'

const revisionSchema = z.number().int().min(1)
const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({ action: z.literal('create'), id: businessIdSchema, kind: z.enum(['restaurant', 'school']), name: z.string().trim().min(2).max(120), phone: z.string() }).strict(),
  z.object({ action: z.literal('workspace'), id: businessIdSchema }).strict(),
  z.object({ action: z.literal('preview'), id: businessIdSchema }).strict(),
  z.object({ action: z.literal('configure'), id: businessIdSchema, revision: revisionSchema, settings: businessSettingsSchema }).strict(),
  z.object({ action: z.literal('activate'), id: businessIdSchema, revision: revisionSchema, status: z.enum(['active', 'suspended']) }).strict(),
  z.object({ action: z.literal('order'), order: orderInputSchema }).strict(),
  z.object({ action: z.literal('my-orders'), id: businessIdSchema }).strict(),
  z.object({ action: z.literal('order-status'), id: businessIdSchema, orderId: businessIdSchema, from: z.enum(orderStates), status: z.enum(orderStates) }).strict(),
  z.object({ action: z.literal('student'), id: businessIdSchema, revision: revisionSchema, student: studentSchema }).strict(),
  z.object({ action: z.literal('attendance'), id: businessIdSchema, revision: revisionSchema, attendance: attendanceSchema }).strict(),
  z.object({ action: z.literal('notify'), id: businessIdSchema, orderId: businessIdSchema }).strict(),
])

type RawBusiness = {
  id: string; owner_id: string; kind: 'restaurant' | 'school'; status: 'draft' | 'active' | 'suspended'; revision: number
  settings: unknown; created_at: string; updated_at: string
}
type RawOrder = {
  id: string; business_id: string; customer_id: string | null; customer_name: string; phone: string; items: unknown
  total_ghs: number | string; fulfilment: 'pickup' | 'delivery'; status: Order['status']; address: string; note: string
  whatsapp_consent: boolean; currency: string; delivery_fee_ghs: number | string; created_at: string; updated_at: string
}

const minor = (value: number | string) => Math.round(Number(value) * 100)
function toBusiness(row: RawBusiness): Business {
  return {
    id: row.id, ownerId: row.owner_id, kind: row.kind, status: row.status, revision: row.revision,
    settings: businessSettingsSchema.parse(row.settings), createdAt: row.created_at, updatedAt: row.updated_at,
  }
}
function toOrder(row: RawOrder): Order {
  return {
    id: row.id, businessId: row.business_id, name: row.customer_name, phone: row.phone,
    items: Array.isArray(row.items) ? row.items as Order['items'] : [], fulfilment: row.fulfilment,
    address: row.address, note: row.note, whatsappConsent: row.whatsapp_consent,
    customerId: row.customer_id ?? '', status: row.status, currency: row.currency,
    totalMinor: minor(row.total_ghs), deliveryFeeMinor: minor(row.delivery_fee_ghs),
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}
function authorize(business: Business | undefined, actor: Actor) {
  if (!business || (business.ownerId !== actor.uid && !actor.admin)) throw new BusinessError(404, 'Business not found.')
}
async function getBusiness(db: SupabaseClient, id: string) {
  const { data, error } = await db.from('businesses').select('*').eq('id', id).maybeSingle()
  if (error) throw new BusinessError(503, 'Business services are unavailable.')
  return data ? toBusiness(data as RawBusiness) : undefined
}
async function event(db: SupabaseClient, businessId: string, actorId: string, action: string) {
  const { error } = await db.from('business_events').insert({ business_id: businessId, actor_id: actorId, action })
  if (error) throw new BusinessError(503, 'Business audit services are unavailable.')
}
function publicShape(business: Business, preview: boolean) {
  const { name, description, address, phone, accent, currency, menu, acceptingOrders, deliveryEnabled, deliveryFeeMinor } = business.settings
  return {
    id: business.id, kind: business.kind, preview,
    settings: { name, description, address, phone, accent, currency, menu: menu.filter((item) => item.available), acceptingOrders: preview ? false : acceptingOrders, deliveryEnabled, deliveryFeeMinor },
  }
}

export async function supabasePublicBusiness(db: SupabaseClient, rawId: unknown, actor?: Actor) {
  const id = businessIdSchema.parse(rawId)
  const business = await getBusiness(db, id)
  if (actor) authorize(business, actor)
  if (!business || (!actor && business.status !== 'active')) throw new BusinessError(404, 'This business is not published.')
  return publicShape(business, Boolean(actor))
}

export async function supabaseBusinessCommand(db: SupabaseClient, actor: Actor, raw: unknown) {
  const command = commandSchema.parse(raw)
  if (command.action === 'list') {
    let query = db.from('businesses').select('*').order('updated_at', { ascending: false }).limit(100)
    if (!actor.admin) query = query.eq('owner_id', actor.uid)
    const { data, error } = await query
    if (error) throw new BusinessError(503, 'Business services are unavailable.')
    return (data ?? []).map((row) => toBusiness(row as RawBusiness))
  }
  if (command.action === 'create') {
    const existing = await getBusiness(db, command.id)
    if (existing) { authorize(existing, actor); return existing }
    const { count, error: countError } = await db.from('businesses').select('id', { count: 'exact', head: true }).eq('owner_id', actor.uid)
    if (countError) throw new BusinessError(503, 'Business services are unavailable.')
    if ((count ?? 0) >= 5) throw new BusinessError(409, 'Contact AuraFlow to add more than five business systems.')
    const settings = businessSettingsSchema.parse({ ...initialBusinessSettings(command.name), phone: command.phone })
    const { data, error } = await db.from('businesses').insert({ id: command.id, owner_id: actor.uid, kind: command.kind, name: command.name, phone: command.phone, settings }).select('*').single()
    if (error || !data) throw new BusinessError(503, 'Business creation is unavailable.')
    await event(db, command.id, actor.uid, 'Business workspace created')
    return toBusiness(data as RawBusiness)
  }
  if (command.action === 'order') {
    const business = await getBusiness(db, command.order.businessId)
    if (!business || business.kind !== 'restaurant' || business.status !== 'active') throw new BusinessError(409, 'This restaurant is unavailable.')
    const quotaHash = createHash('sha256').update(actor.uid).digest('hex')
    const { data: accepted, error: quotaError } = await db.rpc('consume_api_rate_limit', { p_scope: 'business-order', p_subject_hash: quotaHash, p_max_requests: 10 })
    if (quotaError) throw new BusinessError(503, 'Business protection services are unavailable.')
    if (accepted !== true) throw new BusinessError(429, 'Too many orders. Please wait before ordering again.')
    const { data: previous, error: previousError } = await db.from('business_orders').select('*').eq('id', command.order.id).maybeSingle()
    if (previousError) throw new BusinessError(503, 'Order services are unavailable.')
    if (previous) {
      const prior = toOrder(previous as RawOrder)
      if (prior.customerId !== actor.uid) throw new BusinessError(409, 'Please start a new order.')
      return prior
    }
    let priced: ReturnType<typeof priceOrder>
    try { priced = priceOrder(business.settings, command.order) } catch (error) { throw new BusinessError(409, error instanceof Error ? error.message : 'Order cannot be priced.') }
    const { data, error } = await db.from('business_orders').insert({
      id: command.order.id, business_id: business.id, customer_id: actor.uid, customer_name: command.order.name, phone: command.order.phone,
      items: priced.items, total_ghs: priced.totalMinor / 100, fulfilment: command.order.fulfilment, address: command.order.address,
      note: command.order.note, whatsapp_consent: command.order.whatsappConsent, currency: priced.currency, delivery_fee_ghs: priced.deliveryFeeMinor / 100,
    }).select('*').single()
    if (error || !data) throw new BusinessError(503, 'Order services are unavailable.')
    await event(db, business.id, actor.uid, `Order ${command.order.id.slice(0, 8)} received`)
    return toOrder(data as RawOrder)
  }
  if (command.action === 'my-orders') {
    const { data, error } = await db.from('business_orders').select('*').eq('business_id', command.id).eq('customer_id', actor.uid).order('created_at', { ascending: false }).limit(100)
    if (error) throw new BusinessError(503, 'Order services are unavailable.')
    return (data ?? []).map((row) => toOrder(row as RawOrder))
  }
  const business = await getBusiness(db, command.id)
  authorize(business, actor)
  if (!business) throw new BusinessError(404, 'Business not found.')
  if (command.action === 'preview') return publicShape(business, true)
  if (command.action === 'workspace') {
    const [orders, students, attendance, events, outbound] = await Promise.all([
      db.from('business_orders').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(100),
      db.from('business_students').select('*').eq('business_id', business.id).limit(300),
      db.from('business_attendance').select('*').eq('business_id', business.id).order('attendance_date', { ascending: false }).limit(30),
      db.from('business_events').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(50),
      db.from('business_outbound').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(100),
    ])
    if ([orders, students, attendance, events, outbound].some((result) => result.error)) throw new BusinessError(503, 'Business workspace services are unavailable.')
    return {
      business,
      orders: (orders.data ?? []).map((row) => toOrder(row as RawOrder)),
      students: (students.data ?? []).map((row) => ({ id: row.id, name: row.name, admissionNumber: row.admission_number, className: row.class_name, guardianName: row.guardian_name, guardianPhone: row.guardian_phone, active: row.active })),
      attendance: (attendance.data ?? []).map((row) => ({ date: row.attendance_date, entries: row.entries, updatedAt: row.updated_at })),
      events: (events.data ?? []).map((row) => ({ id: row.id, action: row.action, actorId: row.actor_id ?? '', createdAt: row.created_at })),
      outbound: (outbound.data ?? []).map((row) => ({ id: row.id, orderId: row.order_id, orderStatus: row.order_status, state: row.state, createdAt: row.created_at })),
      whatsappReady: supabaseWhatsAppConfigured(business.id),
    }
  }
  if (command.action === 'notify') return sendSupabaseOrderNotification(db, business.id, command.orderId, actor)
  if (command.action === 'configure' || command.action === 'activate') {
    if (command.revision !== business.revision) throw new BusinessError(409, 'This business changed in another session. Reload before saving.')
    if (command.action === 'activate' && !actor.admin) throw new BusinessError(403, 'Only AuraFlow administrators can activate business systems.')
    const settings: BusinessSettings = command.action === 'configure' ? command.settings : business.settings
    if (command.action === 'activate' && command.status === 'active' && (!settings.address || (business.kind === 'restaurant' ? !settings.menu.length : !settings.classes.length)))
      throw new BusinessError(409, 'Complete the address and menu or school classes before activation.')
    if (business.kind === 'school' && business.settings.classes.some((name) => !settings.classes.includes(name))) {
      const { data: students, error } = await db.from('business_students').select('class_name').eq('business_id', business.id)
      if (error) throw new BusinessError(503, 'School register services are unavailable.')
      if ((students ?? []).some((student) => !settings.classes.includes(student.class_name))) throw new BusinessError(409, 'Move students to another class before removing their class.')
    }
    const update = command.action === 'activate' ? { settings, status: command.status, revision: business.revision + 1 } : { settings, revision: business.revision + 1 }
    const { data, error } = await db.from('businesses').update(update).eq('id', business.id).eq('revision', business.revision).select('*').maybeSingle()
    if (error) throw new BusinessError(503, 'Business configuration is unavailable.')
    if (!data) throw new BusinessError(409, 'This business changed in another session. Reload before saving.')
    await event(db, business.id, actor.uid, command.action === 'activate' ? `Business ${command.status}` : 'Business configuration updated')
    return { saved: true }
  }
  if (command.action === 'order-status') {
    if (business.kind !== 'restaurant') throw new BusinessError(409, 'Orders belong to restaurant systems.')
    const { data: row, error } = await db.from('business_orders').select('*').eq('id', command.orderId).eq('business_id', business.id).maybeSingle()
    if (error) throw new BusinessError(503, 'Order services are unavailable.')
    if (!row) throw new BusinessError(409, 'The order changed or this transition is unavailable. Refresh the order.')
    const order = toOrder(row as RawOrder)
    if (order.status !== command.from || !canTransitionOrder(order.status, command.status, order.fulfilment)) throw new BusinessError(409, 'The order changed or this transition is unavailable. Refresh the order.')
    const { data: updated, error: updateError } = await db.from('business_orders').update({ status: command.status }).eq('id', order.id).eq('status', command.from).select('id').maybeSingle()
    if (updateError) throw new BusinessError(503, 'Order services are unavailable.')
    if (!updated) throw new BusinessError(409, 'The order changed or this transition is unavailable. Refresh the order.')
    await event(db, business.id, actor.uid, `Order ${order.id.slice(0, 8)}: ${command.status}`)
    return { saved: true }
  }
  if (command.action === 'student') {
    if (command.revision !== business.revision) throw new BusinessError(409, 'The school register changed in another session. Reload before saving.')
    if (business.kind !== 'school') throw new BusinessError(409, 'Student records belong to school systems.')
    if (!business.settings.classes.includes(command.student.className)) throw new BusinessError(400, 'Select a configured school class.')
    const { count, error: countError } = await db.from('business_students').select('id', { count: 'exact', head: true }).eq('business_id', business.id)
    if (countError) throw new BusinessError(503, 'School register services are unavailable.')
    const { data: existing, error: existingError } = await db.from('business_students').select('id').eq('id', command.student.id).maybeSingle()
    if (existingError) throw new BusinessError(503, 'School register services are unavailable.')
    if (!existing && (count ?? 0) >= 300) throw new BusinessError(409, 'This pilot supports 300 students. Contact AuraFlow to expand it.')
    const { error: studentError } = await db.from('business_students').upsert({ id: command.student.id, business_id: business.id, name: command.student.name, admission_number: command.student.admissionNumber, class_name: command.student.className, guardian_name: command.student.guardianName, guardian_phone: command.student.guardianPhone, active: command.student.active })
    if (studentError) {
      if (studentError.code === '23505') throw new BusinessError(409, 'Admission number already exists.')
      throw new BusinessError(503, 'School register services are unavailable.')
    }
    const { data: changed } = await db.from('businesses').update({ revision: business.revision + 1 }).eq('id', business.id).eq('revision', business.revision).select('id').maybeSingle()
    if (!changed) throw new BusinessError(409, 'The school register changed in another session. Reload before saving.')
    await event(db, business.id, actor.uid, 'Student record saved')
    return { saved: true }
  }
  if (command.action === 'attendance') {
    if (command.revision !== business.revision) throw new BusinessError(409, 'The school register changed in another session. Reload before saving.')
    if (business.kind !== 'school') throw new BusinessError(409, 'Attendance belongs to school systems.')
    if (command.attendance.date > new Date().toISOString().slice(0, 10)) throw new BusinessError(400, 'Attendance cannot be recorded for a future date.')
    const { data: active, error } = await db.from('business_students').select('id').eq('business_id', business.id).eq('active', true)
    if (error) throw new BusinessError(503, 'School register services are unavailable.')
    const activeIds = new Set((active ?? []).map((student) => student.id))
    if (activeIds.size !== command.attendance.entries.length || command.attendance.entries.some((entry) => !activeIds.has(entry.studentId))) throw new BusinessError(409, 'Mark the complete active school register before saving.')
    const { error: attendanceError } = await db.from('business_attendance').upsert({ business_id: business.id, attendance_date: command.attendance.date, entries: command.attendance.entries })
    if (attendanceError) throw new BusinessError(503, 'Attendance services are unavailable.')
    const { data: changed } = await db.from('businesses').update({ revision: business.revision + 1 }).eq('id', business.id).eq('revision', business.revision).select('id').maybeSingle()
    if (!changed) throw new BusinessError(409, 'The school register changed in another session. Reload before saving.')
    await event(db, business.id, actor.uid, `Attendance recorded: ${command.attendance.date}`)
    return { saved: true }
  }
  throw new BusinessError(400, 'Unsupported business action.')
}

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { BusinessError, type Actor } from '../errors.js'

const integrationSchema = z.object({
  phoneNumberId: z.string().regex(/^\d+$/),
  accessToken: z.string().min(20),
  templateName: z.string().regex(/^[a-z0-9_]+$/),
  language: z.string().regex(/^[a-z]{2}(?:_[A-Z]{2})?$/),
})
type WhatsAppConfig = z.infer<typeof integrationSchema>

function integrationFromEnvironment(businessId: string): WhatsAppConfig | null {
  const raw = process.env.WHATSAPP_TENANTS_JSON
  if (!raw) return null
  const all = z.record(z.string().uuid(), integrationSchema).parse(JSON.parse(raw))
  if (new Set(Object.values(all).map((item) => item.phoneNumberId)).size !== Object.keys(all).length)
    throw new Error('Duplicate WhatsApp numbers in tenant configuration')
  return all[businessId] ?? null
}

export function supabaseWhatsAppConfigured(businessId: string) {
  return Boolean(integrationFromEnvironment(businessId))
}

export function validWebhookSignature(body: Buffer, signature: string, secret: string) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false
  const expected = createHmac('sha256', secret).update(body).digest()
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))
}

export async function sendSupabaseOrderNotification(db: SupabaseClient, businessId: string, orderId: string, actor: Actor) {
  const config = integrationFromEnvironment(businessId)
  if (!config) throw new BusinessError(409, "Connect this restaurant's WhatsApp Business account with AuraFlow before sending updates.")
  const version = process.env.WHATSAPP_GRAPH_VERSION
  if (!version || !/^v\d+\.\d+$/.test(version)) throw new BusinessError(503, 'WhatsApp API version is not configured.')
  const { data: order, error: orderError } = await db.from('business_orders').select('id, status, phone, whatsapp_consent').eq('id', orderId).eq('business_id', businessId).maybeSingle()
  if (orderError) throw new BusinessError(503, 'Order services are unavailable.')
  if (!order || !order.whatsapp_consent) throw new BusinessError(409, 'This customer has not opted in to WhatsApp order updates.')
  const { data: outbound, error: outboundError } = await db.from('business_outbound').insert({
    business_id: businessId, order_id: order.id, order_status: order.status, state: 'submitting', actor_id: actor.uid,
  }).select('id').single()
  if (outboundError) {
    if (outboundError.code === '23505') throw new BusinessError(409, 'This update was already submitted. Check its delivery status before sending another update.')
    throw new BusinessError(503, 'WhatsApp delivery services are unavailable.')
  }
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: order.phone.slice(1), type: 'template',
        template: { name: config.templateName, language: { code: config.language }, components: [{ type: 'body', parameters: [{ type: 'text', text: order.id.slice(0, 8) }, { type: 'text', text: order.status }] }] },
      }),
    })
    const result = await response.json() as { messages?: { id: string }[] }
    if (!response.ok || !result.messages?.[0]?.id) throw new Error('Provider rejected notification')
    const messageId = result.messages[0].id
    const [{ error: updateError }, { error: receiptError }, { error: eventError }] = await Promise.all([
      db.from('business_outbound').update({ state: 'accepted', message_id: messageId }).eq('id', outbound.id),
      db.from('business_whatsapp_receipts').insert({ message_id_hash: createHash('sha256').update(messageId).digest('hex'), business_id: businessId, outbound_id: outbound.id, phone_number_id: config.phoneNumberId }),
      db.from('business_events').insert({ business_id: businessId, actor_id: actor.uid, action: `WhatsApp update submitted: ${order.id.slice(0, 8)}` }),
    ])
    if (updateError || receiptError || eventError) throw new Error('Could not persist WhatsApp receipt')
    return { accepted: true }
  } catch {
    await db.from('business_outbound').update({ state: 'needs-review' }).eq('id', outbound.id)
    throw new BusinessError(502, 'Delivery could not be confirmed. AuraFlow must review the notification before retrying.')
  }
}

export async function receiveSupabaseWhatsAppStatuses(db: SupabaseClient, raw: unknown) {
  const payload = z.object({ entry: z.array(z.object({ changes: z.array(z.object({ value: z.object({ metadata: z.object({ phone_number_id: z.string() }).optional(), statuses: z.array(z.object({ id: z.string(), status: z.enum(['sent', 'delivered', 'read', 'failed']), timestamp: z.string().regex(/^\d+$/) })).optional() }) })) })).max(100) }).parse(raw)
  for (const entry of payload.entry) for (const change of entry.changes) for (const status of change.value.statuses ?? []) {
    const hash = createHash('sha256').update(status.id).digest('hex')
    const { data: receipt } = await db.from('business_whatsapp_receipts').select('business_id, outbound_id, phone_number_id').eq('message_id_hash', hash).maybeSingle()
    if (!receipt || receipt.phone_number_id !== change.value.metadata?.phone_number_id) continue
    const { data: outbound } = await db.from('business_outbound').select('state, provider_timestamp').eq('id', receipt.outbound_id).maybeSingle()
    if (!outbound || Number(outbound.provider_timestamp ?? 0) > Number(status.timestamp)) continue
    const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3 }
    if ((rank[outbound.state] ?? 0) > (rank[status.status] ?? 0) && status.status !== 'failed') continue
    await db.from('business_outbound').update({ state: status.status, provider_timestamp: Number(status.timestamp) }).eq('id', receipt.outbound_id)
  }
}

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { Firestore } from 'firebase-admin/firestore'
import type { Order } from '../../src/domain/business.js'
import { BusinessError, type Actor } from './firebase.js'

const integrationSchema = z.object({
  phoneNumberId: z.string().regex(/^\d+$/),
  accessToken: z.string().min(20),
  templateName: z.string().regex(/^[a-z0-9_]+$/),
  language: z.string().regex(/^[a-z]{2}(?:_[A-Z]{2})?$/),
})
export function whatsappConfig(businessId: string) {
  const raw = process.env.WHATSAPP_TENANTS_JSON
  if (!raw) return null
  const all = z
    .record(z.string().uuid(), integrationSchema)
    .parse(JSON.parse(raw))
  if (
    new Set(Object.values(all).map((c) => c.phoneNumberId)).size !==
    Object.keys(all).length
  )
    throw new Error('Duplicate WhatsApp numbers in tenant configuration')
  return all[businessId] || null
}
export function validWebhookSignature(
  body: Buffer,
  signature: string,
  secret: string,
) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false
  const expected = createHmac('sha256', secret).update(body).digest()
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))
}
export async function sendOrderNotification(
  db: Firestore,
  businessId: string,
  orderId: string,
  actor: Actor,
) {
  const config = whatsappConfig(businessId)
  if (!config)
    throw new BusinessError(
      409,
      "Connect this restaurant's WhatsApp Business account with AuraFlow before sending updates.",
    )
  const version = process.env.WHATSAPP_GRAPH_VERSION
  if (!version || !/^v\d+\.\d+$/.test(version))
    throw new BusinessError(503, 'WhatsApp API version is not configured.')
  const ref = db.doc(`businesses/${businessId}`)
  const order = (await ref.collection('orders').doc(orderId).get()).data() as
    Order | undefined
  if (!order || !order.whatsappConsent)
    throw new BusinessError(
      409,
      'This customer has not opted in to WhatsApp order updates.',
    )
  const outbox = ref.collection('outbound').doc(`${orderId}-${order.status}`)
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(outbox)
    if (existing.exists)
      throw new BusinessError(
        409,
        'This update was already submitted. Check its delivery status before sending another update.',
      )
    tx.create(outbox, {
      orderId,
      orderStatus: order.status,
      state: 'submitting',
      actorId: actor.uid,
      createdAt: new Date().toISOString(),
    })
  })
  // No automatic retry: a timeout can mean Meta accepted the message.
  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: order.phone.slice(1),
          type: 'template',
          template: {
            name: config.templateName,
            language: { code: config.language },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: order.id.slice(0, 8) },
                  { type: 'text', text: order.status },
                ],
              },
            ],
          },
        }),
      },
    )
    const result = (await response.json()) as { messages?: { id: string }[] }
    if (!response.ok || !result.messages?.[0]?.id)
      throw new Error('Provider rejected notification')
    const messageId = result.messages[0].id
    const batch = db.batch()
    batch.update(outbox, { state: 'accepted', messageId })
    batch.set(
      db.doc(
        `whatsappReceipts/${createHash('sha256').update(messageId).digest('hex')}`,
      ),
      { businessId, outboxId: outbox.id, phoneNumberId: config.phoneNumberId },
    )
    batch.create(ref.collection('events').doc(), {
      action: `WhatsApp update submitted: ${order.id.slice(0, 8)}`,
      actorId: actor.uid,
      createdAt: new Date().toISOString(),
    })
    await batch.commit()
    return { accepted: true }
  } catch {
    await outbox.update({ state: 'needs-review' })
    throw new BusinessError(
      502,
      'Delivery could not be confirmed. AuraFlow must review the notification before retrying.',
    )
  }
}
export async function receiveWhatsAppStatuses(db: Firestore, raw: unknown) {
  const payload = z
    .object({
      entry: z
        .array(
          z.object({
            changes: z.array(
              z.object({
                value: z.object({
                  metadata: z
                    .object({ phone_number_id: z.string() })
                    .optional(),
                  statuses: z
                    .array(
                      z.object({
                        id: z.string(),
                        status: z.enum(['sent', 'delivered', 'read', 'failed']),
                        timestamp: z.string().regex(/^\d+$/),
                      }),
                    )
                    .optional(),
                }),
              }),
            ),
          }),
        )
        .max(100),
    })
    .parse(raw)
  for (const entry of payload.entry)
    for (const change of entry.changes)
      for (const status of change.value.statuses || []) {
        const mapping = (
          await db
            .doc(
              `whatsappReceipts/${createHash('sha256').update(status.id).digest('hex')}`,
            )
            .get()
        ).data()
        if (
          !mapping ||
          mapping.phoneNumberId !== change.value.metadata?.phone_number_id
        )
          continue
        const ref = db.doc(
          `businesses/${mapping.businessId}/outbound/${mapping.outboxId}`,
        )
        await db.runTransaction(async (tx) => {
          const previous = (await tx.get(ref)).data()
          if (
            !previous ||
            Number(previous.providerTimestamp || 0) > Number(status.timestamp)
          )
            return
          const rank: Record<string, number> = {
            sent: 1,
            delivered: 2,
            read: 3,
          }
          if (
            (rank[previous.state] || 0) > (rank[status.status] || 0) &&
            status.status !== 'failed'
          )
            return
          tx.update(ref, {
            state: status.status,
            providerTimestamp: status.timestamp,
          })
        })
      }
}

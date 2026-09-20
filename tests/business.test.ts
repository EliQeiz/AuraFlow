import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import {
  businessSettingsSchema,
  initialBusinessSettings,
  orderInputSchema,
  priceOrder,
  canTransitionOrder,
} from '../src/domain/business'
import {
  alignLayers,
  duplicatePage,
  moveLayers,
} from '../src/domain/studioEditing'
import { defaultDraft, draftSchema } from '../src/domain/studio'
import { newLayer } from '../src/domain/composition'
import { validWebhookSignature } from '../server/business/whatsapp'

test('checkout computes totals from the catalog and rejects invalid payloads', () => {
  const id = randomUUID(),
    settings = {
      ...initialBusinessSettings('Test Kitchen'),
      acceptingOrders: true,
      deliveryEnabled: true,
      deliveryFeeMinor: 1250,
      menu: [
        {
          id,
          name: 'Jollof',
          description: '',
          category: 'Rice',
          priceMinor: 7000,
          available: true,
        },
      ],
    }
  const order = orderInputSchema.parse({
    id: randomUUID(),
    businessId: randomUUID(),
    name: 'Customer Name',
    phone: '+233506624529',
    fulfilment: 'delivery',
    address: 'Accra, Ghana',
    note: '',
    whatsappConsent: false,
    items: [{ id, quantity: 2 }],
  })
  assert.equal(priceOrder(settings, order).totalMinor, 15250)
  assert.equal(
    orderInputSchema.safeParse({ ...order, totalMinor: 1 }).success,
    false,
  )
  assert.equal(
    orderInputSchema.safeParse({
      ...order,
      items: [...order.items, ...order.items],
    }).success,
    false,
  )
  assert.equal(
    orderInputSchema.safeParse({ ...order, items: [{ id, quantity: -1 }] })
      .success,
    false,
  )
  assert.throws(() => priceOrder({ ...settings, menu: [] }, order), /no longer/)
  assert.throws(
    () => priceOrder({ ...settings, acceptingOrders: false }, order),
    /not accepting/,
  )
  assert.throws(
    () => priceOrder({ ...settings, deliveryEnabled: false }, order),
    /unavailable/,
  )
  assert.equal(
    businessSettingsSchema.safeParse({ ...settings, classes: ['P1', 'P1'] })
      .success,
    false,
  )
})
test('order lifecycle separates collection from delivery and protects terminal states', () => {
  assert.equal(canTransitionOrder('received', 'completed', 'pickup'), false)
  assert.equal(canTransitionOrder('ready', 'completed', 'pickup'), true)
  assert.equal(canTransitionOrder('ready', 'completed', 'delivery'), false)
  assert.equal(
    canTransitionOrder('ready', 'out-for-delivery', 'delivery'),
    true,
  )
  assert.equal(canTransitionOrder('completed', 'cancelled', 'delivery'), false)
})
test('WhatsApp signatures require the exact signed bytes', () => {
  const body = Buffer.from('{"entry":[]}'),
    secret = 'test-secret'
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
  assert.equal(validWebhookSignature(body, signature, secret), true)
  assert.equal(
    validWebhookSignature(Buffer.from('{}'), signature, secret),
    false,
  )
  assert.equal(validWebhookSignature(body, 'sha256=00', secret), false)
  assert.equal(validWebhookSignature(body, signature, ''), false)
})
test('studio group movement, alignment and page copies preserve constraints', () => {
  const layers = [0, 1, 2].map((i) => ({
    ...newLayer('rectangle', 'Home'),
    width: 100,
    height: 80,
    x: 100 + i * 200,
    y: 100 + i * 30,
  }))
  const ids = layers.map((l) => l.id)
  const moved = moveLayers(layers, ids, -400, -400)
  assert.deepEqual(
    moved.map((l) => l.x),
    [0, 200, 400],
  )
  const aligned = alignLayers(layers, ids, 'top')
  assert.deepEqual(
    aligned.map((l) => l.y),
    [100, 100, 100],
  )
  const locked = { ...layers[2], locked: true }
  assert.equal(
    alignLayers([layers[0], layers[1], locked], ids, 'left')[2],
    locked,
  )
  const draft = {
    ...defaultDraft('school-management-system', 'School', ['Students'], []),
    layers,
  }
  const copy = duplicatePage(draft, 'Home')
  assert.equal(copy.draft.layers.length, 6)
  assert.equal(new Set(copy.draft.layers.map((l) => l.id)).size, 6)
  assert.equal(draftSchema.safeParse(copy.draft).success, true)
  assert.throws(
    () =>
      duplicatePage(
        { ...draft, layers: [...layers, ...layers, ...layers] },
        'Home',
      ),
    /limit/,
  )
})

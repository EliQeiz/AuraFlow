import { test, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { businessCommand, publicBusiness } from '../server/business/service'
import { receiveWhatsAppStatuses } from '../server/business/whatsapp'
import {
  initialBusinessSettings,
  type Business,
  type Order,
  type WorkspaceData,
} from '../src/domain/business'

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8780')
  throw new Error(
    'Business integration tests require the local Firestore emulator.',
  )
const app = initializeApp(
  { projectId: 'demo-auraflow' },
  'business-integration',
)
const db = getFirestore(app)
after(() => deleteApp(app))
const actor = { uid: `business-owner-${randomUUID()}`, admin: false },
  other = { uid: `other-${randomUUID()}`, admin: false },
  admin = { uid: 'business-admin-test', admin: true }
const call = (raw: unknown, who = actor) => businessCommand(db, who, raw)
test('tenant setup, isolation, order idempotency, lifecycle, admin activation and audit', async () => {
  const id = randomUUID(),
    itemId = randomUUID()
  await call({
    action: 'create',
    id,
    name: 'Local Kitchen',
    kind: 'restaurant',
    phone: '+233506624529',
  })
  await assert.rejects(
    () => call({ action: 'workspace', id }, other),
    /not found/,
  )
  await assert.rejects(() => publicBusiness(db, id), /not published/)
  assert.equal((await publicBusiness(db, id, actor)).preview, true)
  await assert.rejects(() => publicBusiness(db, id, other), /not found/)
  const settings = {
    ...initialBusinessSettings('Local Kitchen'),
    address: 'Accra, Ghana',
    acceptingOrders: true,
    menu: [
      {
        id: itemId,
        name: 'Jollof rice',
        description: 'Rice and chicken',
        category: 'Local dishes',
        priceMinor: 7000,
        available: true,
      },
    ],
  }
  await call({ action: 'configure', id, revision: 1, settings })
  await assert.rejects(
    () => call({ action: 'configure', id, revision: 1, settings }),
    /another session/,
  )
  await assert.rejects(
    () => call({ action: 'activate', id, revision: 2, status: 'active' }),
    /Only AuraFlow/,
  )
  await call({ action: 'activate', id, revision: 2, status: 'active' }, admin)
  const publicSite = await publicBusiness(db, id)
  assert.equal('ownerId' in publicSite, false)
  const order = {
    id: randomUUID(),
    businessId: id,
    name: 'Order Customer',
    phone: '+233506624529',
    fulfilment: 'pickup',
    address: '',
    note: '',
    whatsappConsent: false,
    items: [{ id: itemId, quantity: 2 }],
  }
  const results = (await Promise.all([
    call({ action: 'order', order }, other),
    call({ action: 'order', order }, other),
  ])) as Order[]
  assert.equal(results[0].totalMinor, 14000)
  assert.equal(results[0].id, results[1].id)
  assert.equal((await db.collection(`businesses/${id}/orders`).get()).size, 1)
  await assert.rejects(
    () =>
      call(
        {
          action: 'order-status',
          id,
          orderId: order.id,
          from: 'received',
          status: 'accepted',
        },
        other,
      ),
    /not found/,
  )
  await assert.rejects(
    () =>
      call({
        action: 'order-status',
        id,
        orderId: order.id,
        from: 'received',
        status: 'completed',
      }),
    /transition/,
  )
  await call({
    action: 'order-status',
    id,
    orderId: order.id,
    from: 'received',
    status: 'accepted',
  })
  const workspace = (await call({ action: 'workspace', id })) as WorkspaceData
  assert.equal(workspace.orders[0].status, 'accepted')
  assert.equal(workspace.events.length, 4)
  assert.equal(((await call({ action: 'my-orders', id })) as Order[]).length, 0)
  assert.equal(
    ((await call({ action: 'my-orders', id }, other)) as Order[]).length,
    1,
  )
  await call(
    { action: 'activate', id, revision: 3, status: 'suspended' },
    admin,
  )
  await assert.rejects(
    () =>
      call({ action: 'order', order: { ...order, id: randomUUID() } }, other),
    /unavailable/,
  )
})
test('school records reject duplicate admissions, foreign attendance and removed classes', async () => {
  const id = randomUUID(),
    studentId = randomUUID()
  await call({
    action: 'create',
    id,
    name: 'New School',
    kind: 'school',
    phone: '+233506624529',
  })
  const settings = {
    ...initialBusinessSettings('New School'),
    classes: ['P1'],
    address: 'Tema, Ghana',
  }
  await call({ action: 'configure', id, revision: 1, settings })
  const student = {
    id: studentId,
    name: 'Test Student',
    admissionNumber: 'AF-001',
    className: 'P1',
    guardianName: 'Test Guardian',
    guardianPhone: '+233506624529',
    active: true,
  }
  await call({ action: 'student', id, revision: 2, student })
  await assert.rejects(
    () => call({ action: 'student', id, revision: 2, student }),
    /another session/,
  )
  await assert.rejects(
    () =>
      call({
        action: 'student',
        id,
        revision: 3,
        student: { ...student, id: randomUUID() },
      }),
    /already exists/,
  )
  await assert.rejects(
    () =>
      call({
        action: 'configure',
        id,
        revision: 3,
        settings: { ...settings, classes: [] },
      }),
    /Move students/,
  )
  await assert.rejects(
    () =>
      call({
        action: 'attendance',
        id,
        revision: 3,
        attendance: {
          date: '2026-01-01',
          entries: [{ studentId: randomUUID(), state: 'present' }],
        },
      }),
    /active students/,
  )
  await call({
    action: 'attendance',
    id,
    revision: 3,
    attendance: {
      date: '2026-01-01',
      entries: [{ studentId, state: 'present' }],
    },
  })
  const workspace = (await call({ action: 'workspace', id })) as WorkspaceData
  assert.equal(workspace.attendance[0].entries[0].state, 'present')
  await assert.rejects(
    () =>
      call({
        action: 'attendance',
        id,
        revision: 3,
        attendance: {
          date: '2026-01-01',
          entries: [{ studentId, state: 'absent' }],
        },
      }),
    /another session/,
  )
  const otherList = (await call({ action: 'list' }, other)) as Business[]
  assert.equal(
    otherList.some((b) => b.id === id),
    false,
  )
})

test('WhatsApp is tenant scoped, consent gated, deduplicated and updated by provider status', async () => {
  const id = randomUUID(),
    orderId = randomUUID(),
    itemId = randomUUID()
  await call({
    action: 'create',
    id,
    name: 'WhatsApp test kitchen',
    kind: 'restaurant',
    phone: '+233506624529',
  })
  await call({
    action: 'configure',
    id,
    revision: 1,
    settings: {
      ...initialBusinessSettings('WhatsApp test kitchen'),
      address: 'Accra',
      acceptingOrders: true,
      menu: [
        {
          id: itemId,
          name: 'Waakye',
          category: 'Local',
          description: '',
          available: true,
          priceMinor: 4000,
        },
      ],
    },
  })
  await call({ action: 'activate', id, revision: 2, status: 'active' }, admin)
  const order = {
    id: orderId,
    businessId: id,
    name: 'Consenting Customer',
    phone: '+233506624529',
    fulfilment: 'pickup',
    address: '',
    note: '',
    whatsappConsent: true,
    items: [{ id: itemId, quantity: 1 }],
  }
  await call({ action: 'order', order }, other)
  const previous = process.env.WHATSAPP_TENANTS_JSON,
    previousVersion = process.env.WHATSAPP_GRAPH_VERSION
  process.env.WHATSAPP_TENANTS_JSON = JSON.stringify({
    [id]: {
      phoneNumberId: '12345678',
      accessToken: 'test-only-not-a-real-access-token',
      templateName: 'order_status',
      language: 'en',
    },
  })
  process.env.WHATSAPP_GRAPH_VERSION = 'v25.0'
  const messageId = `test-message-${randomUUID()}`
  const fetchMock = mock.method(
    globalThis,
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      assert.match(String(url), /12345678\/messages$/)
      const body = JSON.parse(String(init?.body))
      assert.equal(body.to, '233506624529')
      assert.equal(
        body.template.components[0].parameters[0].text,
        orderId.slice(0, 8),
      )
      return new Response(JSON.stringify({ messages: [{ id: messageId }] }), {
        status: 200,
      })
    },
  )
  try {
    await assert.rejects(
      () => call({ action: 'notify', id, orderId }, other),
      /not found/,
    )
    await call({ action: 'notify', id, orderId })
    await assert.rejects(
      () => call({ action: 'notify', id, orderId }),
      /already submitted/,
    )
    assert.equal(fetchMock.mock.callCount(), 1)
    const payload = (phone: string, state: string, timestamp: string) => ({
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: phone },
                statuses: [{ id: messageId, status: state, timestamp }],
              },
            },
          ],
        },
      ],
    })
    await receiveWhatsAppStatuses(db, payload('99999999', 'read', '3'))
    assert.equal(
      (
        await db.doc(`businesses/${id}/outbound/${orderId}-received`).get()
      ).data()?.state,
      'accepted',
    )
    await receiveWhatsAppStatuses(db, payload('12345678', 'delivered', '2'))
    await receiveWhatsAppStatuses(db, payload('12345678', 'sent', '1'))
    assert.equal(
      (
        await db.doc(`businesses/${id}/outbound/${orderId}-received`).get()
      ).data()?.state,
      'delivered',
    )
    const noConsentId = randomUUID()
    await call(
      {
        action: 'order',
        order: { ...order, id: noConsentId, whatsappConsent: false },
      },
      other,
    )
    await assert.rejects(
      () => call({ action: 'notify', id, orderId: noConsentId }),
      /not opted in/,
    )
    assert.equal(fetchMock.mock.callCount(), 1)
  } finally {
    fetchMock.mock.restore()
    if (previous === undefined) delete process.env.WHATSAPP_TENANTS_JSON
    else process.env.WHATSAPP_TENANTS_JSON = previous
    if (previousVersion === undefined) delete process.env.WHATSAPP_GRAPH_VERSION
    else process.env.WHATSAPP_GRAPH_VERSION = previousVersion
  }
})

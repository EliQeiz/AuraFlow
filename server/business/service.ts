import { createHash, randomUUID } from 'node:crypto'
import type { Firestore } from 'firebase-admin/firestore'
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
  type Order,
  type Student,
} from '../../src/domain/business.js'
import { BusinessError, type Actor } from './firebase.js'
import { whatsappConfig, sendOrderNotification } from './whatsapp.js'

const revisionSchema = z.number().int().min(1)
const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z
    .object({
      action: z.literal('create'),
      id: businessIdSchema,
      kind: z.enum(['restaurant', 'school']),
      name: z.string().trim().min(2).max(120),
      phone: z.string(),
    })
    .strict(),
  z.object({ action: z.literal('workspace'), id: businessIdSchema }).strict(),
  z.object({ action: z.literal('preview'), id: businessIdSchema }).strict(),
  z
    .object({
      action: z.literal('configure'),
      id: businessIdSchema,
      revision: revisionSchema,
      settings: businessSettingsSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('activate'),
      id: businessIdSchema,
      revision: revisionSchema,
      status: z.enum(['active', 'suspended']),
    })
    .strict(),
  z.object({ action: z.literal('order'), order: orderInputSchema }).strict(),
  z.object({ action: z.literal('my-orders'), id: businessIdSchema }).strict(),
  z
    .object({
      action: z.literal('order-status'),
      id: businessIdSchema,
      orderId: businessIdSchema,
      from: z.enum(orderStates),
      status: z.enum(orderStates),
    })
    .strict(),
  z
    .object({
      action: z.literal('student'),
      id: businessIdSchema,
      revision: revisionSchema,
      student: studentSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('attendance'),
      id: businessIdSchema,
      revision: revisionSchema,
      attendance: attendanceSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('notify'),
      id: businessIdSchema,
      orderId: businessIdSchema,
    })
    .strict(),
])
const rows = (snapshot: FirebaseFirestore.QuerySnapshot) =>
  snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))
function authorize(business: Business | undefined, actor: Actor) {
  if (!business || (business.ownerId !== actor.uid && !actor.admin))
    throw new BusinessError(404, 'Business not found.')
}
export async function publicBusiness(
  db: Firestore,
  rawId: unknown,
  actor?: Actor,
) {
  const id = businessIdSchema.parse(rawId)
  const data = (await db.doc(`businesses/${id}`).get()).data() as
    Business | undefined
  if (actor) authorize(data, actor)
  if (!data || (!actor && data.status !== 'active'))
    throw new BusinessError(404, 'This business is not published.')
  const {
    name,
    description,
    address,
    phone,
    accent,
    currency,
    menu,
    acceptingOrders,
    deliveryEnabled,
    deliveryFeeMinor,
  } = data.settings
  return {
    id,
    kind: data.kind,
    preview: Boolean(actor),
    settings: {
      name,
      description,
      address,
      phone,
      accent,
      currency,
      menu: menu.filter((i) => i.available),
      acceptingOrders: actor ? false : acceptingOrders,
      deliveryEnabled,
      deliveryFeeMinor,
    },
  }
}
export async function businessCommand(
  db: Firestore,
  actor: Actor,
  raw: unknown,
) {
  const command = commandSchema.parse(raw)
  const now = new Date().toISOString()
  if (command.action === 'list') {
    const collection = db.collection('businesses')
    return rows(
      await (
        actor.admin ? collection : collection.where('ownerId', '==', actor.uid)
      )
        .limit(100)
        .get(),
    )
  }
  if (command.action === 'create') {
    const settings = businessSettingsSchema.parse({
      ...initialBusinessSettings(command.name),
      phone: command.phone,
    })
    const ref = db.doc(`businesses/${command.id}`),
      quota = db.doc(`businessQuotas/${actor.uid}`)
    return db.runTransaction(async (tx) => {
      const [existing, usage] = await tx.getAll(ref, quota)
      if (existing.exists) {
        authorize(existing.data() as Business, actor)
        return existing.data()
      }
      const count = Number(usage.data()?.count || 0)
      if (count >= 5)
        throw new BusinessError(
          409,
          'Contact AuraFlow to add more than five business systems.',
        )
      const business: Business = {
        id: command.id,
        ownerId: actor.uid,
        kind: command.kind,
        status: 'draft',
        revision: 1,
        settings,
        createdAt: now,
        updatedAt: now,
      }
      tx.create(ref, business)
      tx.set(quota, { count: count + 1 })
      return business
    })
  }
  if (command.action === 'order') {
    const input = command.order
    const businessRef = db.doc(`businesses/${input.businessId}`),
      orderRef = businessRef.collection('orders').doc(input.id)
    const quota = db.doc(
      `orderQuotas/${createHash('sha256').update(actor.uid).digest('hex')}`,
    )
    return db.runTransaction(async (tx) => {
      const [businessDoc, previous, usage] = await tx.getAll(
        businessRef,
        orderRef,
        quota,
      )
      const business = businessDoc.data() as Business | undefined
      if (
        !business ||
        business.kind !== 'restaurant' ||
        business.status !== 'active'
      )
        throw new BusinessError(409, 'This restaurant is unavailable.')
      if (previous.exists) {
        if (previous.data()?.customerId !== actor.uid)
          throw new BusinessError(409, 'Please start a new order.')
        return previous.data()
      }
      const window = Math.floor(Date.now() / 600_000)
      const count =
        usage.data()?.window === window ? Number(usage.data()?.count) : 0
      if (count >= 10)
        throw new BusinessError(
          429,
          'Too many orders. Please wait before ordering again.',
        )
      let priced
      try {
        priced = priceOrder(business.settings, input)
      } catch (error) {
        throw new BusinessError(409, (error as Error).message)
      }
      const order: Order = {
        ...input,
        ...priced,
        customerId: actor.uid,
        status: 'received',
        createdAt: now,
        updatedAt: now,
      }
      tx.create(orderRef, order)
      tx.set(quota, { count: count + 1, window })
      tx.create(businessRef.collection('events').doc(), {
        action: `Order ${input.id.slice(0, 8)} received`,
        actorId: actor.uid,
        createdAt: now,
      })
      return order
    })
  }
  const ref = db.doc(`businesses/${command.id}`)
  if (command.action === 'my-orders')
    return rows(
      await ref
        .collection('orders')
        .where('customerId', '==', actor.uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get(),
    )
  const business = (await ref.get()).data() as Business | undefined
  authorize(business, actor)
  if (command.action === 'preview') return publicBusiness(db, command.id, actor)
  if (command.action === 'workspace') {
    const [orders, students, attendance, events, outbound] = await Promise.all([
      ref.collection('orders').orderBy('createdAt', 'desc').limit(100).get(),
      ref.collection('students').limit(300).get(),
      ref.collection('attendance').orderBy('date', 'desc').limit(30).get(),
      ref.collection('events').orderBy('createdAt', 'desc').limit(50).get(),
      ref.collection('outbound').orderBy('createdAt', 'desc').limit(100).get(),
    ])
    return {
      business,
      orders: rows(orders),
      students: rows(students),
      attendance: rows(attendance),
      events: rows(events),
      outbound: rows(outbound),
      whatsappReady: Boolean(whatsappConfig(command.id)),
    }
  }
  if (command.action === 'notify')
    return sendOrderNotification(db, command.id, command.orderId, actor)
  return db.runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data() as Business | undefined
    authorize(current, actor)
    if (!current) throw new BusinessError(404, 'Business not found.')
    let action: string = command.action
    if (command.action === 'configure' || command.action === 'activate') {
      if (command.revision !== current.revision)
        throw new BusinessError(
          409,
          'This business changed in another session. Reload before saving.',
        )
      if (command.action === 'activate' && !actor.admin)
        throw new BusinessError(
          403,
          'Only AuraFlow administrators can activate business systems.',
        )
      const settings =
        command.action === 'configure' ? command.settings : current.settings
      if (
        command.action === 'activate' &&
        command.status === 'active' &&
        (!settings.address ||
          (current.kind === 'restaurant'
            ? !settings.menu.length
            : !settings.classes.length))
      )
        throw new BusinessError(
          409,
          'Complete the address and menu or school classes before activation.',
        )
      if (
        current.kind === 'school' &&
        current.settings.classes.some(
          (name) => !settings.classes.includes(name),
        )
      ) {
        const students = await tx.get(ref.collection('students'))
        if (
          students.docs.some(
            (doc) => !settings.classes.includes(doc.data().className),
          )
        )
          throw new BusinessError(
            409,
            'Move students to another class before removing their class.',
          )
      }
      tx.update(ref, {
        settings,
        ...(command.action === 'activate' ? { status: command.status } : {}),
        revision: current.revision + 1,
        updatedAt: now,
      })
      action =
        command.action === 'activate'
          ? `Business ${command.status}`
          : 'Business configuration updated'
    } else if (command.action === 'order-status') {
      if (current.kind !== 'restaurant')
        throw new BusinessError(409, 'Orders belong to restaurant systems.')
      const orderRef = ref.collection('orders').doc(command.orderId)
      const order = (await tx.get(orderRef)).data() as Order | undefined
      if (
        !order ||
        order.status !== command.from ||
        !canTransitionOrder(order.status, command.status, order.fulfilment)
      )
        throw new BusinessError(
          409,
          'The order changed or this transition is unavailable. Refresh the order.',
        )
      tx.update(orderRef, { status: command.status, updatedAt: now })
      action = `Order ${command.orderId.slice(0, 8)}: ${command.status}`
    } else if (command.action === 'student') {
      if (command.revision !== current.revision)
        throw new BusinessError(
          409,
          'The school register changed in another session. Reload before saving.',
        )
      if (current.kind !== 'school')
        throw new BusinessError(
          409,
          'Student records belong to school systems.',
        )
      if (!current.settings.classes.includes(command.student.className))
        throw new BusinessError(400, 'Select a configured school class.')
      const students = await tx.get(ref.collection('students'))
      if (
        students.size >= 300 &&
        !students.docs.some((d) => d.id === command.student.id)
      )
        throw new BusinessError(
          409,
          'This pilot supports 300 students. Contact AuraFlow to expand it.',
        )
      if (
        students.docs.some(
          (d) =>
            d.id !== command.student.id &&
            String(d.data().admissionNumber).toLowerCase() ===
              command.student.admissionNumber.toLowerCase(),
        )
      )
        throw new BusinessError(409, 'Admission number already exists.')
      tx.set(
        ref.collection('students').doc(command.student.id),
        command.student,
      )
      // The parent revision serializes roster writes, including admission-number uniqueness checks.
      tx.update(ref, { revision: current.revision + 1, updatedAt: now })
      action = 'Student record saved'
    } else if (command.action === 'attendance') {
      if (command.revision !== current.revision)
        throw new BusinessError(
          409,
          'The school register changed in another session. Reload before saving.',
        )
      if (current.kind !== 'school')
        throw new BusinessError(409, 'Attendance belongs to school systems.')
      if (command.attendance.date > now.slice(0, 10))
        throw new BusinessError(
          400,
          'Attendance cannot be recorded for a future date.',
        )
      const students = await tx.getAll(
        ...command.attendance.entries.map((e) =>
          ref.collection('students').doc(e.studentId),
        ),
      )
      const activeRoster = await tx.get(
        ref.collection('students').where('active', '==', true),
      )
      if (activeRoster.size !== command.attendance.entries.length)
        throw new BusinessError(
          409,
          'Mark the complete active school register before saving.',
        )
      if (students.some((d) => !d.exists || !(d.data() as Student).active))
        throw new BusinessError(
          400,
          'Attendance must reference active students in this school.',
        )
      tx.set(ref.collection('attendance').doc(command.attendance.date), {
        ...command.attendance,
        updatedAt: now,
      })
      tx.update(ref, { revision: current.revision + 1, updatedAt: now })
      action = `Attendance recorded: ${command.attendance.date}`
    }
    tx.create(ref.collection('events').doc(randomUUID()), {
      action,
      actorId: actor.uid,
      createdAt: now,
    })
    return { saved: true }
  })
}

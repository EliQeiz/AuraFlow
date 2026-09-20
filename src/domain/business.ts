import { z } from 'zod'

export const businessIdSchema = z.string().uuid()
const label = z.string().trim().min(2).max(120)
const phone = z
  .string()
  .regex(
    /^\+[1-9][0-9]{7,14}$/,
    'Use international format, for example +233506624529',
  )
export const menuItemSchema = z
  .object({
    id: z.string().uuid(),
    name: label,
    description: z.string().trim().max(500),
    category: z.string().trim().min(2).max(60),
    priceMinor: z.number().int().min(1).max(100_000_000),
    available: z.boolean(),
  })
  .strict()
export const businessSettingsSchema = z
  .object({
    name: label,
    description: z.string().trim().max(1200),
    address: z.string().trim().max(500),
    phone,
    accent: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    currency: z.enum(['GHS', 'NGN', 'ZAR', 'USD', 'EUR', 'GBP']),
    acceptingOrders: z.boolean(),
    deliveryEnabled: z.boolean(),
    deliveryFeeMinor: z.number().int().min(0).max(10_000_000),
    menu: z
      .array(menuItemSchema)
      .max(60)
      .refine((items) => new Set(items.map((i) => i.id)).size === items.length),
    academicYear: z.string().trim().max(40),
    term: z.string().trim().max(40),
    classes: z
      .array(z.string().trim().min(1).max(60))
      .max(40)
      .refine((items) => new Set(items).size === items.length),
  })
  .strict()
export type BusinessSettings = z.infer<typeof businessSettingsSchema>
export type Business = {
  id: string
  ownerId: string
  kind: 'restaurant' | 'school'
  status: 'draft' | 'active' | 'suspended'
  revision: number
  createdAt: string
  updatedAt: string
  settings: BusinessSettings
}
export const initialBusinessSettings = (name: string): BusinessSettings => ({
  name,
  description: '',
  address: '',
  phone: '+233506624529',
  accent: '#6c63ff',
  currency: 'GHS',
  acceptingOrders: false,
  deliveryEnabled: false,
  deliveryFeeMinor: 0,
  menu: [],
  academicYear: '',
  term: '',
  classes: [],
})
export const orderInputSchema = z
  .object({
    id: z.string().uuid(),
    businessId: businessIdSchema,
    name: label,
    phone,
    fulfilment: z.enum(['pickup', 'delivery']),
    address: z.string().trim().max(500),
    note: z.string().trim().max(500),
    whatsappConsent: z.boolean(),
    items: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            quantity: z.number().int().min(1).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(30)
      .refine(
        (items) => new Set(items.map((i) => i.id)).size === items.length,
        'Duplicate menu items',
      ),
  })
  .strict()
  .refine(
    (input) => input.fulfilment !== 'delivery' || input.address.length >= 5,
    'A delivery address is required',
  )
export const orderStates = [
  'received',
  'accepted',
  'preparing',
  'ready',
  'out-for-delivery',
  'completed',
  'cancelled',
] as const
export type OrderState = (typeof orderStates)[number]
export type Order = Omit<z.infer<typeof orderInputSchema>, 'items'> & {
  customerId: string
  status: OrderState
  createdAt: string
  updatedAt: string
  currency: string
  totalMinor: number
  deliveryFeeMinor: number
  items: { id: string; name: string; quantity: number; priceMinor: number }[]
}
export function priceOrder(
  settings: BusinessSettings,
  input: z.infer<typeof orderInputSchema>,
) {
  if (!settings.acceptingOrders)
    throw new Error('This restaurant is not accepting orders.')
  if (input.fulfilment === 'delivery' && !settings.deliveryEnabled)
    throw new Error('Delivery is unavailable.')
  const items = input.items.map((line) => {
    const item = settings.menu.find(
      (item) => item.id === line.id && item.available,
    )
    if (!item)
      throw new Error('A menu item is no longer available. Refresh the menu.')
    return {
      id: item.id,
      name: item.name,
      priceMinor: item.priceMinor,
      quantity: line.quantity,
    }
  })
  const deliveryFeeMinor =
    input.fulfilment === 'delivery' ? settings.deliveryFeeMinor : 0
  return {
    items,
    deliveryFeeMinor,
    totalMinor: items.reduce(
      (sum, i) => sum + i.priceMinor * i.quantity,
      deliveryFeeMinor,
    ),
    currency: settings.currency,
  }
}
export function canTransitionOrder(
  from: OrderState,
  to: OrderState,
  fulfilment: 'pickup' | 'delivery',
) {
  const next: Record<OrderState, readonly OrderState[]> = {
    received: ['accepted', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready:
      fulfilment === 'delivery'
        ? ['out-for-delivery', 'cancelled']
        : ['completed', 'cancelled'],
    'out-for-delivery': ['completed'],
    completed: [],
    cancelled: [],
  }
  return next[from].includes(to)
}
export const studentSchema = z
  .object({
    id: z.string().uuid(),
    name: label,
    admissionNumber: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-zA-Z0-9-]+$/),
    className: z.string().trim().min(1).max(60),
    guardianName: label,
    guardianPhone: phone,
    active: z.boolean(),
  })
  .strict()
export type Student = z.infer<typeof studentSchema>
export const attendanceSchema = z
  .object({
    date: z.iso.date(),
    entries: z
      .array(
        z
          .object({
            studentId: z.string().uuid(),
            state: z.enum(['present', 'absent', 'late', 'excused']),
          })
          .strict(),
      )
      .min(1)
      .max(300),
  })
  .strict()
  .refine(
    (d) => new Set(d.entries.map((e) => e.studentId)).size === d.entries.length,
  )
export type Attendance = z.infer<typeof attendanceSchema> & {
  updatedAt: string
}
export type BusinessEvent = {
  id: string
  action: string
  actorId: string
  createdAt: string
}
export type WorkspaceData = {
  business: Business
  orders: Order[]
  students: Student[]
  attendance: Attendance[]
  events: BusinessEvent[]
  whatsappReady: boolean
  outbound: {
    id: string
    orderId: string
    orderStatus: string
    state: string
    createdAt: string
  }[]
}
export const money = (minor: number, currency: string) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(
    minor / 100,
  )

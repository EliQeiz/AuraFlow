import { z } from 'zod'
import { draftSchema } from './studio'

export const requestStatuses = [
  'Submitted',
  'Discovery',
  'Designing',
  'Building',
  'Review',
  'Completed',
  'On Hold',
] as const
export const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), 'Use an http or https URL.')
const optionalText = (max: number) => z.string().max(max).optional()
const optionalList = (max: number) =>
  z.array(z.string().max(400)).max(max).optional()
const prototypeSpecSchema = z.object({
  businessName: z.string().min(1).max(160),
  platformMode: z.enum(['managed-hosted', 'custom-build', 'prototype-only']),
  selectedModules: z.array(z.string().max(180)).max(30),
  brandTone: z.string().max(120),
  colorPreference: z.string().max(120),
  adminRoles: z.array(z.string().max(180)).max(20),
  coreWorkflows: z.string().min(30).max(6000),
  contentNotes: z.string().min(20).max(6000),
  solutionSlug: optionalText(180),
  suiteSlug: optionalText(180),
  subdomainPreference: optionalText(120),
  selectedWorkflows: optionalList(20),
  selectedRoles: optionalList(20),
  dataSources: optionalText(6000),
  complianceNotes: optionalText(4000),
  launchModel: optionalText(120),
  selectedBuilderFeatures: optionalList(20),
  themePreset: optionalText(120),
  primaryColor: optionalText(32),
  accentColor: optionalText(32),
  logoDirection: optionalText(4000),
  bannerDirection: optionalText(4000),
  mediaPlan: optionalText(5000),
  automationNeeds: optionalList(12),
  paymentPlan: optionalText(4000),
  tenantAdminNotes: optionalText(5000),
  contentOwnershipConfirmed: z.literal(true).optional(),
})
export const requestSchema = z
  .object({
    userId: z.string().min(1).max(128),
    clientName: z.string().trim().min(1).max(120),
    clientEmail: z.string().trim().email().max(254),
    title: z.string().trim().min(2, 'Give your project a title.').max(180),
    projectType: z.string().trim().min(1).max(180),
    description: z
      .string()
      .trim()
      .min(40, 'Describe your project in at least 40 characters.')
      .max(12000),
    audience: z.string().trim().min(1).max(800),
    budget: z.number().int().min(39).max(100000),
    timeline: z.string().min(1).max(120),
    referenceLinks: z.array(httpUrl).max(8),
    templateSlug: z.string().max(180).optional(),
    solutionSlug: z.string().max(180).optional(),
    platformMode: z
      .enum(['managed-hosted', 'custom-build', 'prototype-only'])
      .optional(),
    subdomainPreference: z.string().max(120).optional(),
    prototypeSpec: prototypeSpecSchema.optional(),
    design: draftSchema.optional(),
    designDraftId: z.string().min(1).max(180).optional(),
  })
  .refine((request) => !request.design || Boolean(request.designDraftId), {
    message: 'Save your design before attaching it to a project.',
    path: ['designDraftId'],
  })
export const messageText = z
  .string()
  .trim()
  .min(2, 'Write at least two characters.')
  .max(4000, 'Keep your message under 4,000 characters.')
export const revisionText = z
  .string()
  .trim()
  .min(20, 'Describe the change in at least 20 characters.')
  .max(4000)
export const adminUpdateSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  adminSummary: z.string().trim().max(6000).optional(),
  deadline: z.string().max(120).optional(),
  tenantSlug: z.string().max(120).optional(),
  stagingUrl: z.union([httpUrl, z.literal('')]).optional(),
  productionUrl: z.union([httpUrl, z.literal('')]).optional(),
})

export function timestampDate(value: unknown): Date | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  )
    return value.toDate() as Date
  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  )
    return new Date(value.seconds * 1000)
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}
export function displayDate(value: unknown) {
  return (
    timestampDate(value)?.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) ?? 'Just now'
  )
}

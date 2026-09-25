import { z } from 'zod'

export const studentBands = ['1-100', '101-300', '301-800', '801-2000', '2000+'] as const
export const staffBands = ['1-15', '16-50', '51-150', '151+'] as const
export const tenantPlans = ['trial', 'starter', 'professional', 'enterprise'] as const
export const requestStates = ['submitted', 'discovery', 'approved', 'provisioning', 'ready', 'declined', 'cancelled'] as const

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,62}$/, 'Use 3-63 lowercase letters, numbers, or hyphens.')
const moduleList = z.array(z.string().trim().min(2).max(80)).max(24)

export const demoBookingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional().default(''),
  schoolName: z.string().trim().min(2).max(180),
  roleTitle: z.string().trim().min(2).max(80),
  studentBand: z.enum(studentBands),
  message: z.string().trim().max(3000).optional().default(''),
})

export const provisioningRequestSchema = z.object({
  schoolName: z.string().trim().min(2).max(180),
  preferredSlug: slug,
  schoolType: z.string().trim().min(2).max(80),
  studentBand: z.enum(studentBands),
  staffBand: z.enum(staffBands),
  curriculum: z.string().trim().min(2).max(180),
  launchTarget: z.string().date().optional().or(z.literal('')).default(''),
  requestedModules: moduleList.default([]),
  branding: z.object({ primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), logoDirection: z.string().trim().max(240).optional() }).default({}),
  notes: z.string().trim().max(6000).default(''),
})

export type ProvisioningRequestInput = z.infer<typeof provisioningRequestSchema>
export type TenantPlan = (typeof tenantPlans)[number]
export type ProvisioningState = (typeof requestStates)[number]

export interface BusinessCenterRequest {
  id: string
  schoolName: string
  preferredSlug: string
  schoolType: string
  studentBand: string
  staffBand: string
  curriculum: string
  launchTarget?: string
  requestedModules: string[]
  branding: { primaryColor?: string; logoDirection?: string }
  notes: string
  status: ProvisioningState
  adminNote: string
  tenantId?: string
  tenantLifecycle?: string
  hostname?: string
  ownerEmail?: string
  createdAt: string
  updatedAt: string
}

export const schoolModuleOptions = [
  'Admissions & enrolment', 'Student and guardian records', 'Attendance', 'Assessment & report cards',
  'Fees & Mobile Money', 'Parent portal', 'Teacher portal', 'Staff & HR', 'Transport', 'Boarding', 'Feeding', 'Inventory & assets',
]

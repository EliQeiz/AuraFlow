import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { demoBookingSchema, provisioningRequestSchema } from '../src/domain/business-center.js'

test('Business Center accepts a bounded school setup and rejects unsafe subdomains', () => {
  const valid = provisioningRequestSchema.safeParse({
    schoolName: 'Crestview International School', preferredSlug: 'crestview-international', schoolType: 'International school',
    studentBand: '301-800', staffBand: '51-150', curriculum: 'GES and Cambridge', launchTarget: '2026-10-01',
    requestedModules: ['Admissions & enrolment', 'Attendance'], branding: { primaryColor: '#5f55e8', logoDirection: 'Existing crest' }, notes: 'Migrate verified student records.',
  })
  assert.equal(valid.success, true)
  assert.equal(provisioningRequestSchema.safeParse({ ...valid.data, preferredSlug: '../../other-school' }).success, false)
  assert.equal(provisioningRequestSchema.safeParse({ ...valid.data, branding: { primaryColor: 'javascript:alert(1)' } }).success, false)
})

test('Business Center demo requests require a real contact and constrained school size', () => {
  assert.equal(demoBookingSchema.safeParse({ fullName: 'Ama Mensah', email: 'ama@crestview.edu.gh', schoolName: 'Crestview', roleTitle: 'Proprietor', studentBand: '101-300' }).success, true)
  assert.equal(demoBookingSchema.safeParse({ fullName: 'A', email: 'not-an-email', schoolName: 'C', roleTitle: '', studentBand: 'all' }).success, false)
})

test('Business Center migration establishes tenant-scoped records, RLS, and service-only provisioning', () => {
  const migration = readFileSync(new URL('../supabase/migrations/0012_business_center_tenant_core.sql', import.meta.url), 'utf8')
  for (const fragment of [
    'business_center_tenants', 'business_center_tenant_memberships', 'business_center_tenant_domains',
    'tenant_id uuid not null', 'enable row level security', 'is_business_center_tenant_member',
    'revoke all on function public.provision_business_center_school', 'grant execute on function public.provision_business_center_school',
  ]) assert.ok(migration.includes(fragment), `Expected migration fragment: ${fragment}`)
})

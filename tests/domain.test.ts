import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  authDestination,
  registrationSchema,
  safeReturnPath,
} from '../src/domain/auth'
import {
  adminUpdateSchema,
  requestSchema,
  revisionText,
  timestampDate,
} from '../src/domain/projects'
import { defaultDraft, draftSchema } from '../src/domain/studio'
import { buildTemplatePreviewDocument } from '../src/lib/templatePreview'

test('auth preserves an internal destination including query and fragment', () => {
  assert.equal(
    authDestination({
      from: {
        pathname: '/dashboard/studio',
        search: '?suite=school',
        hash: '#brand',
      },
    }),
    '/dashboard/studio?suite=school#brand',
  )
  for (const value of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/register?next=x',
    '/\n/evil.test',
  ])
    assert.equal(safeReturnPath(value), '/dashboard')
})
test('registration requires matching passwords, consent, and a valid email', () => {
  const valid = {
    name: 'Elisha Afari',
    email: 'test@example.com',
    password: 'a long passphrase',
    confirm: 'a long passphrase',
    terms: true,
  }
  assert.equal(registrationSchema.safeParse(valid).success, true)
  for (const patch of [
    { terms: false },
    { confirm: 'no match' },
    { email: 'invalid' },
    { password: '123' },
  ])
    assert.equal(
      registrationSchema.safeParse({ ...valid, ...patch }).success,
      false,
    )
})
test('project writes reject executable URLs and invalid brief ranges', () => {
  const valid = {
    userId: 'client-a',
    clientName: 'Client',
    clientEmail: 'a@example.com',
    title: 'School website',
    projectType: 'School',
    description:
      'A school website with admissions and a private parent portal.',
    audience: 'Parents',
    budget: 500,
    timeline: 'Flexible',
    referenceLinks: ['https://example.com'],
  }
  assert.equal(requestSchema.safeParse(valid).success, true)
  for (const patch of [
    { budget: -1 },
    { budget: 40.5 },
    { description: 'Short' },
    { referenceLinks: ['javascript:alert(1)'] },
  ])
    assert.equal(requestSchema.safeParse({ ...valid, ...patch }).success, false)
  assert.equal(
    adminUpdateSchema.safeParse({ stagingUrl: 'data:text/html,test' }).success,
    false,
  )
  assert.equal(
    adminUpdateSchema.safeParse({ status: 'Unknown' }).success,
    false,
  )
  assert.equal(revisionText.safeParse('tiny').success, false)
})
test('studio documents are versioned, bounded and preserve brand controls', () => {
  const draft = defaultDraft(
    'school',
    'Adinkra Academy',
    ['Admissions'],
    ['Admin'],
  )
  assert.deepEqual(draftSchema.parse(draft), draft)
  for (const patch of [
    { modules: [] },
    { pages: [] },
    { primaryColor: 'url(evil)' },
    { schemaVersion: 99 },
    { mediaPaths: Array(21).fill('path') },
  ])
    assert.equal(draftSchema.safeParse({ ...draft, ...patch }).success, false)
})
test('timestamps tolerate absent and malformed data without inventing dates', () => {
  assert.equal(timestampDate(undefined), null)
  assert.equal(timestampDate('not-a-date'), null)
  assert.equal(
    timestampDate({ seconds: 0 })?.toISOString(),
    '1970-01-01T00:00:00.000Z',
  )
})

test('sandbox previews use absolute workspace handoffs and escape template content', () => {
  const template = {
    slug: 'cafe" onclick="alert(1)',
    category: 'Restaurant',
    subcategory: 'Cafe',
    style: 'Minimal',
    colorScheme: 'Light',
    name: '<script>alert(1)</script>',
    description: 'Coffee',
    previewImage: '',
    screenshots: [],
    pages: ['Home'],
    features: [],
    techStack: [],
    price: 29,
  }
  const html = buildTemplatePreviewDocument(
    template,
    'https://auraflow.example/templates',
  )
  assert.ok(
    html.includes(
      `href="https://auraflow.example/dashboard/requests/new?template=${encodeURIComponent(template.slug)}"`,
    ),
  )
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.throws(() =>
    buildTemplatePreviewDocument(template, 'javascript:alert(1)'),
  )
})

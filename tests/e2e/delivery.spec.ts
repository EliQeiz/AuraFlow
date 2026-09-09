import { test, expect, type Page } from '@playwright/test'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const password = 'AuraFlow-workflow-test-2026!'
async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}
test('connected delivery workflow, admin controls, activity and checkpoint restoration', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  if (
    !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error('Only run against local emulators.')
  const id = `delivery-${Date.now()}`
  const app = initializeApp({ projectId: 'demo-auraflow' }, id)
  const auth = getAuth(app),
    db = getFirestore(app)
  const client = await auth.createUser({
    email: `${id}@example.com`,
    password,
    displayName: 'Delivery Client',
  })
  const owner = await auth.createUser({
    email: `${id}-admin@example.com`,
    password,
    displayName: 'Delivery Admin',
  })
  await auth.setCustomUserClaims(owner.uid, { admin: true })
  await db.doc(`projects/${id}`).set({
    userId: client.uid,
    title: 'Akwaaba website',
    clientName: 'Delivery Client',
    clientEmail: client.email,
    projectType: 'Hotel',
    description:
      'A booking website with a room gallery and local visitor guide.',
    audience: 'Guests',
    budget: 1000,
    timeline: 'Flexible',
    referenceLinks: [],
    assets: [],
    previews: [],
    status: 'Submitted',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  const adminContext = await browser.newContext(),
    clientContext = await browser.newContext()
  const adminPage = await adminContext.newPage(),
    clientPage = await clientContext.newPage()
  try {
    await login(adminPage, owner.email!)
    await adminPage.goto(`/dashboard/admin?project=${id}`)
    await adminPage.getByLabel('Search client projects').fill('Akwaaba website')
    await adminPage
      .getByLabel('Priority for Akwaaba website')
      .selectOption('urgent')
    await expect(
      adminPage.getByLabel('Priority for Akwaaba website'),
    ).toHaveValue('urgent')
    await adminPage
      .getByLabel('Select Akwaaba website', { exact: true })
      .check()
    await adminPage.getByLabel('Bulk project status').selectOption('Designing')
    adminPage.once('dialog', (dialog) => dialog.accept())
    await adminPage
      .getByRole('button', { name: 'Apply status', exact: true })
      .click()
    await expect(adminPage.locator('.operations .status')).toHaveText(
      'Designing',
    )
    const download = adminPage.waitForEvent('download')
    await adminPage.getByRole('button', { name: 'Export report' }).click()
    expect((await download).suggestedFilename()).toContain(
      'auraflow-operations-',
    )
    await adminPage
      .getByRole('tab', { name: 'Private notes', exact: true })
      .click()
    await adminPage
      .getByLabel('Internal note', { exact: true })
      .fill('Private delivery estimate: three working days.')
    await adminPage.getByRole('button', { name: 'Add private note' }).click()
    await expect(adminPage.locator('.private-note')).toContainText(
      'three working days',
    )
    await adminPage.getByRole('tab', { name: 'Workflow', exact: true }).click()
    await adminPage.getByRole('button', { name: 'Add deliverable' }).click()
    await adminPage
      .getByLabel('Title', { exact: true })
      .fill('Supply property photographs')
    await adminPage.getByLabel('Milestone owner').selectOption('client')
    await adminPage
      .getByRole('button', { name: 'Publish', exact: true })
      .click()
    await expect(adminPage.locator('.work-row')).toContainText(
      'Supply property photographs',
    )
    await adminPage.getByRole('button', { name: 'Add deliverable' }).click()
    await adminPage.getByLabel('Deliverable type').selectOption('review')
    await adminPage
      .getByLabel('Title', { exact: true })
      .fill('Room gallery - version 1')
    await adminPage
      .getByLabel('Reference or version preview URL')
      .fill('https://example.com/gallery-v1')
    await adminPage
      .getByRole('button', { name: 'Publish', exact: true })
      .click()
    await expect(adminPage.locator('.work-row')).toContainText(
      'Room gallery - version 1',
    )
    await expect(
      adminPage.getByRole('button', { name: 'Approve version' }),
    ).toHaveCount(0)

    await login(clientPage, client.email!)
    await clientPage.goto(`/dashboard/requests/${id}?view=workflow`)
    await expect(
      clientPage.getByRole('tab', { name: 'Private notes' }),
    ).toHaveCount(0)
    await clientPage
      .getByRole('button', { name: 'Complete', exact: true })
      .click()
    await expect(
      clientPage.locator('.workflow-progress progress'),
    ).toHaveAttribute('value', '1')
    await clientPage.getByRole('tab', { name: /^Approvals/ }).click()
    await clientPage.getByRole('button', { name: 'Approve version' }).click()
    await expect(clientPage.locator('.work-row .status')).toHaveText('approved')
    await expect(
      clientPage.getByRole('button', { name: 'Approve version' }),
    ).toHaveCount(0)
    await clientPage.getByRole('button', { name: 'New change request' }).click()
    await clientPage
      .getByLabel('Title', { exact: true })
      .fill('Add airport pickup options')
    await clientPage
      .getByLabel('Details', { exact: true })
      .fill('Add a pickup request to the booking page.')
    await clientPage
      .getByRole('button', { name: 'Publish', exact: true })
      .click()
    await expect(clientPage.locator('.work-row')).toContainText(
      'Add airport pickup options',
    )
    await adminPage.getByRole('tab', { name: /^Change requests/ }).click()
    await adminPage.getByRole('button', { name: 'Accept request' }).click()
    await expect(clientPage.locator('.work-row .status')).toHaveText('accepted')
    await clientPage.goto('/dashboard/activity')
    await expect(clientPage.locator('.activity-list')).toContainText(
      'Room gallery - version 1',
    )
    await clientPage.getByRole('button', { name: 'Mark all read' }).click()
    await expect(
      clientPage.getByRole('tab', { name: 'Unread (0)' }),
    ).toBeVisible()
    await clientPage.reload()
    await expect(
      clientPage.getByRole('tab', { name: 'Unread (0)' }),
    ).toBeVisible()
    await clientPage.setViewportSize({ width: 390, height: 844 })
    expect(
      await clientPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy()
    await clientPage.screenshot({
      path: 'artifacts/activity-mobile.png',
      fullPage: true,
    })
    await clientPage.setViewportSize({ width: 1440, height: 1000 })

    await adminPage
      .getByRole('tab', { name: 'Saved replies', exact: true })
      .click()
    await adminPage.getByLabel('Reply title').fill('Files received')
    await adminPage
      .getByLabel('Reply text')
      .fill('Thank you. We have received your project files.')
    await adminPage
      .getByRole('button', { name: 'Save reply', exact: true })
      .click()
    await expect(adminPage.locator('.history-list')).toContainText(
      'Files received',
    )
    await adminPage.getByRole('tab', { name: 'Projects', exact: true }).click()
    await adminPage.getByRole('tab', { name: 'Delivery', exact: true }).click()
    await adminPage
      .getByLabel('Insert saved reply')
      .selectOption({ label: 'Files received' })
    await expect(adminPage.getByLabel('Your message')).toHaveValue(
      'Thank you. We have received your project files.',
    )
    await adminPage.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(adminPage.getByRole('log')).toContainText(
      'Thank you. We have received your project files.',
    )
    await adminPage.getByRole('tab', { name: 'Workflow', exact: true }).click()
    await adminPage.screenshot({
      path: 'artifacts/admin-delivery-desktop.png',
      fullPage: true,
    })
    await adminPage.setViewportSize({ width: 390, height: 844 })
    expect(
      await adminPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy()
    await adminPage.screenshot({
      path: 'artifacts/admin-delivery-mobile.png',
      fullPage: true,
    })

    await clientPage.goto(
      '/dashboard/studio?suite=hotel-lodge-guesthouse-booking',
    )
    await clientPage
      .getByLabel('Business name', { exact: true })
      .fill('Akwaaba House')
    await clientPage
      .getByRole('button', { name: 'Save design', exact: true })
      .click()
    await expect(clientPage).toHaveURL(/draft=/)
    await clientPage
      .getByLabel('Business name', { exact: true })
      .fill('Akwaaba Lodge')
    await clientPage
      .getByRole('button', { name: 'Save design', exact: true })
      .click()
    await expect(clientPage.locator('.studio-save-state')).toContainText(
      'Version 2',
    )
    await clientPage
      .getByRole('button', { name: 'History', exact: true })
      .click()
    clientPage.once('dialog', (dialog) => dialog.accept())
    await clientPage
      .locator('.history-list article')
      .filter({ hasText: 'Version 1' })
      .getByRole('button', { name: 'Restore' })
      .click()
    await expect(
      clientPage.getByLabel('Business name', { exact: true }),
    ).toHaveValue('Akwaaba House')
    await clientPage
      .getByRole('button', { name: 'Save design', exact: true })
      .click()
    await expect(clientPage.locator('.studio-save-state')).toContainText(
      'Version 3',
    )
  } finally {
    await adminContext.close()
    await clientContext.close()
  }
})

test('website reels pause, respect reduced motion and keep gallery layouts stable', async ({
  page,
}) => {
  await page.goto('/templates')
  await page
    .getByRole('tab', { name: 'Website templates', exact: true })
    .click()
  await expect(page.locator('.library-item')).toHaveCount(12)
  await page.getByLabel('Search templates').fill('Cafe')
  const reel = page.locator('.motion-media').first()
  await reel.scrollIntoViewIfNeeded()
  await reel.hover()
  await expect(reel).toHaveAttribute('data-playing', 'true')
  await reel.getByRole('button', { name: /^Pause/ }).click()
  await expect(reel).toHaveAttribute('data-playing', 'false')
  await reel.getByRole('button', { name: /^Play/ }).click()
  await expect(reel).toHaveAttribute('data-playing', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(reel).toHaveAttribute('data-playing', 'false')
  await expect(reel.locator('.media-play')).toHaveCount(0)
  await page.getByLabel('Search templates').fill('')
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
    await Promise.all(
      Array.from(document.images, (image) =>
        image.decode().catch(() => undefined),
      ),
    )
  })
  await page.screenshot({
    path: 'artifacts/website-library-desktop.png',
    fullPage: true,
    animations: 'disabled',
  })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy()
  await page.screenshot({
    path: 'artifacts/website-library-mobile.png',
    fullPage: true,
    animations: 'disabled',
  })
})

test('an admin activity link opens an older project outside the recent 100', async ({
  page,
}) => {
  if (
    !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error('Only run against local emulators.')
  const id = `history-${Date.now()}`
  const app = initializeApp({ projectId: 'demo-auraflow' }, id)
  const db = getFirestore(app)
  const user = await getAuth(app).createUser({
    email: `${id}@example.com`,
    password,
    displayName: 'History Admin',
  })
  await getAuth(app).setCustomUserClaims(user.uid, { admin: true })
  const base = {
    userId: 'history-client',
    clientName: 'History client',
    clientEmail: 'history@example.com',
    projectType: 'Website',
    description: 'An older project retained for future design reviews.',
    audience: 'Visitors',
    budget: 500,
    timeline: 'Flexible',
    referenceLinks: [],
    assets: [],
    previews: [],
    status: 'Review',
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
  }
  const batch = db.batch()
  batch.set(db.doc(`projects/${id}`), {
    ...base,
    title: 'Archived chronology project',
  })
  for (let i = 0; i < 101; i++)
    batch.set(db.doc(`projects/${id}-recent-${i}`), {
      ...base,
      title: `History fixture ${i}`,
      updatedAt: FieldValue.serverTimestamp(),
    })
  await batch.commit()
  await login(page, user.email!)
  await page.goto(`/dashboard/admin?project=${id}&view=workflow&kind=review`)
  await expect(page.locator('.admin-project-detail')).toContainText(
    'Archived chronology project',
  )
  await expect(page.getByRole('tab', { name: /^Approvals/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.locator('.operations .data-table')).not.toContainText(
    'Archived chronology project',
  )
})

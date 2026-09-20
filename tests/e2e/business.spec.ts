import { test, expect, type Page } from '@playwright/test'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { randomUUID } from 'node:crypto'
import { businessCommand } from '../../server/business/service'
import { initialBusinessSettings } from '../../src/domain/business'

const password = 'AuraFlow-business-test-2026!'
async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}
test('business setup, customer ordering, owner fulfilment and school attendance', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8780' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9799'
  )
    throw new Error('Business QA requires emulators')
  const app = initializeApp({ projectId: 'demo-auraflow' }, randomUUID()),
    auth = getAuth(app),
    db = getFirestore(app)
  const suffix = Date.now()
  const owner = await auth.createUser({
    email: `business-${suffix}@example.com`,
    password,
    displayName: 'Restaurant Owner',
    emailVerified: true,
  })
  const customer = await auth.createUser({
    email: `buyer-${suffix}@example.com`,
    password,
    displayName: 'Customer',
    emailVerified: true,
  })
  const admin = await auth.createUser({
    email: `admin-${suffix}@example.com`,
    password,
    emailVerified: true,
  })
  await auth.setCustomUserClaims(admin.uid, { admin: true })
  const ownerContext = await browser.newContext(),
    customerContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    adminContext = await browser.newContext()
  const page = await ownerContext.newPage(),
    buyer = await customerContext.newPage(),
    adminPage = await adminContext.newPage()
  const errors: string[] = []
  for (const p of [page, buyer, adminPage])
    p.on('pageerror', (e) => errors.push(e.message))
  try {
    await login(page, owner.email!)
    await page
      .getByRole('link', { name: 'Business systems', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'New business', exact: true })
      .click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Business name').fill('Accra Test Kitchen')
    await modal.getByLabel('Business phone').fill('+233506624529')
    await modal.getByRole('button', { name: 'Create workspace' }).click()
    await expect(modal).toBeHidden()
    await expect(page).toHaveURL(/business=/)
    const id = new URL(page.url()).searchParams.get('business')!
    await page.getByLabel('Address', { exact: true }).fill('Osu, Accra')
    await page.getByLabel('Accept orders', { exact: true }).check()
    await page
      .getByRole('button', { name: 'Save configuration', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Save configuration', exact: true }),
    ).toBeDisabled()
    await page.getByRole('tab', { name: 'Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Add item', exact: true }).click()
    await page.getByLabel('Dish name').fill('Jollof & chicken')
    await page
      .getByLabel('Description', { exact: true })
      .fill('Freshly prepared local rice and chicken')
    await page.getByLabel('Price (GHS)', { exact: true }).fill('70')
    await page.getByRole('button', { name: 'Save menu', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Save menu', exact: true }),
    ).toHaveAttribute('aria-busy', 'true')
    await expect(
      page.getByRole('button', { name: 'Save menu', exact: true }),
    ).not.toHaveAttribute('aria-busy', 'true')
    await expect(
      page.getByRole('button', { name: 'Activate', exact: true }),
    ).toHaveCount(0)
    await login(adminPage, admin.email!)
    await adminPage.goto(`/dashboard/businesses?business=${id}`)
    adminPage.once('dialog', (dialog) => dialog.accept())
    await adminPage
      .getByRole('button', { name: 'Activate', exact: true })
      .click()
    await expect(
      adminPage.getByRole('button', { name: 'Suspend', exact: true }),
    ).toBeVisible()
    await buyer.goto(`/b/${id}`)
    await buyer
      .getByRole('button', { name: 'Add Jollof & chicken', exact: true })
      .click()
    await buyer
      .getByRole('link', { name: 'Sign in to order', exact: true })
      .click()
    await buyer
      .getByLabel('Email address', { exact: true })
      .fill(customer.email!)
    await buyer.getByLabel('Password', { exact: true }).fill(password)
    await buyer.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(buyer).toHaveURL(new RegExp(`/b/${id}$`))
    await expect(buyer.locator('.business-cart')).toContainText(
      'Jollof & chicken',
    )
    await buyer.getByLabel('Your name').fill('Customer Test')
    await buyer.getByLabel('Phone number').fill('+233506624529')
    await buyer
      .getByRole('button', { name: 'Place order', exact: true })
      .click()
    await expect(buyer.locator('.business-customer-orders')).toContainText(
      'received',
    )
    expect(
      await buyer.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await buyer.screenshot({
      path: 'test-results/business-customer-mobile.png',
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Refresh', exact: true }).click()
    await page.getByRole('tab', { name: 'Orders', exact: true }).click()
    await expect(page.locator('.business-order-list')).toContainText(
      'Customer Test',
    )
    await page.getByRole('button', { name: 'accepted', exact: true }).click()
    await expect(
      page.locator('.business-order-list .business-status'),
    ).toHaveText('accepted')
    await page.screenshot({
      path: 'test-results/business-orders-desktop.png',
      fullPage: true,
    })
    await buyer.goto(`/dashboard/businesses?business=${id}`)
    await expect(
      buyer.getByText('Business not found.', { exact: true }),
    ).toBeVisible()
    const schoolId = randomUUID(),
      studentId = randomUUID()
    const actor = { uid: owner.uid, admin: false }
    await businessCommand(db, actor, {
      action: 'create',
      id: schoolId,
      kind: 'school',
      name: 'Tema Test School',
      phone: '+233506624529',
    })
    await businessCommand(db, actor, {
      action: 'configure',
      id: schoolId,
      revision: 1,
      settings: {
        ...initialBusinessSettings('Tema Test School'),
        classes: ['Primary 1'],
        address: 'Tema',
      },
    })
    await businessCommand(db, actor, {
      action: 'student',
      id: schoolId,
      revision: 2,
      student: {
        id: studentId,
        name: 'Student Test',
        admissionNumber: 'AF-101',
        className: 'Primary 1',
        guardianName: 'Guardian Test',
        guardianPhone: '+233506624529',
        active: true,
      },
    })
    await page.goto(`/dashboard/businesses?business=${schoolId}`)
    await page.getByRole('tab', { name: 'Students', exact: true }).click()
    await expect(
      page.getByRole('cell', { name: 'Student Test', exact: true }),
    ).toBeVisible()
    await page.getByRole('tab', { name: 'Attendance', exact: true }).click()
    await page.getByLabel('Attendance for Student Test').selectOption('present')
    await page
      .getByRole('button', { name: 'Save register', exact: true })
      .click()
    await expect(
      page.getByRole('button', { name: 'Save register', exact: true }),
    ).not.toHaveAttribute('aria-busy', 'true')
    await page.getByRole('tab', { name: 'Attendance', exact: true }).click()
    await expect(page.getByLabel('Attendance for Student Test')).toHaveValue(
      'present',
    )
    await page.screenshot({
      path: 'test-results/business-school-desktop.png',
      fullPage: true,
    })
    await page.goto('/dashboard/studio?suite=school-management-system')
    const layers = page.locator('.design-layer')
    await expect(layers).toHaveCount(5)
    await layers.nth(1).click()
    await layers.nth(2).click({ modifiers: ['Shift'] })
    await expect(
      page.locator('.design-layer[data-selected="true"]'),
    ).toHaveCount(2)
    await page.getByRole('button', { name: 'Align top', exact: true }).click()
    const selection = page.locator('.design-layer[data-selected="true"]')
    expect(
      await selection.evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLElement).style.top),
      ),
    ).toEqual(['140px', '140px'])
    await layers.first().dblclick()
    await page.getByLabel('Edit canvas text').fill('Tema school operations')
    await page.getByLabel('Edit canvas text').press('Control+Enter')
    await expect(layers.first()).toContainText('Tema school operations')
    await page.getByRole('button', { name: 'Save design', exact: true }).click()
    await expect(
      page.getByText('Saved · Version 1', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.locator('.design-layer').first()).toContainText(
      'Tema school operations',
    )
    await page.screenshot({
      path: 'test-results/studio-selection-desktop.png',
      fullPage: true,
    })
    expect(errors).toEqual([])
  } finally {
    await ownerContext.close()
    await customerContext.close()
    await adminContext.close()
    await deleteApp(app)
  }
})

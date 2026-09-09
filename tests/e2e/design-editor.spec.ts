import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { initializeApp, deleteApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const password = 'AuraFlow-canvas-test-2026!'
async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email address', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('canvas editing, versioned persistence, exports and owner-only directory', async ({
  browser,
}) => {
  test.setTimeout(180_000)
  if (
    !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !process.env.FIRESTORE_EMULATOR_HOST
  )
    throw new Error('Canvas QA must only run against local emulators.')
  const key = `canvas-${Date.now()}`
  const app = initializeApp({ projectId: 'demo-auraflow' }, key)
  const auth = getAuth(app),
    db = getFirestore(app)
  const client = await auth.createUser({
    email: `${key}@example.com`,
    password,
    displayName: 'Canvas Client',
  })
  const owner = await auth.createUser({
    email: `${key}-owner@example.com`,
    password,
    displayName: 'Canvas Owner',
  })
  await auth.setCustomUserClaims(owner.uid, { admin: true })
  const context = await browser.newContext()
  const ownerContext = await browser.newContext()
  const page = await context.newPage()
  try {
    await login(page, client.email!)
    await expect(
      page.getByRole('link', { name: /Admin console/i }),
    ).toHaveCount(0)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/dashboard/studio?suite=industrial-plant-monitoring')
    await expect(page.locator('.design-layer')).toHaveCount(5)
    await page.getByRole('button', { name: 'Add text', exact: true }).click()
    await page
      .getByLabel('Layer text', { exact: true })
      .fill('Akosombo plant operations')
    await page.getByLabel('Layer font', { exact: true }).selectOption('mono')
    await page.getByLabel('Y', { exact: true }).fill('720')
    await page.getByLabel('Layer opacity', { exact: true }).press('Home')
    await page.getByLabel('Layer opacity', { exact: true }).press('End')
    const selected = page.locator('.design-layer[data-selected="true"]')
    await expect(selected).toHaveCSS('font-family', /Courier New/)
    await selected.focus()
    await selected.press('Shift+ArrowRight')
    await expect(page.getByLabel('X', { exact: true })).toHaveValue('74')
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await expect(page.getByLabel('X', { exact: true })).toHaveValue('64')
    await page.getByRole('button', { name: 'Redo', exact: true }).click()
    await expect(page.getByLabel('X', { exact: true })).toHaveValue('74')
    const row = page.locator('.design-layers > div').last()
    await row.getByRole('button', { name: 'Hide layer', exact: true }).click()
    await expect(page.locator('.design-layer')).toHaveCount(5)
    await row.getByRole('button', { name: 'Show layer', exact: true }).click()
    await row.getByRole('button', { name: 'Lock layer', exact: true }).click()
    await selected.focus()
    await selected.press('ArrowRight')
    await expect(page.getByLabel('X', { exact: true })).toHaveValue('74')
    await row.getByRole('button', { name: 'Unlock layer', exact: true }).click()
    await page.getByRole('button', { name: 'Save design', exact: true }).click()
    await expect(
      page.getByText('Saved · Version 1', { exact: true }),
    ).toBeVisible()
    const records = await db.collection(`users/${client.uid}/drafts`).get()
    expect(records.size).toBe(1)
    const id = records.docs[0].id
    expect(records.docs[0].data().layers.at(-1).text).toBe(
      'Akosombo plant operations',
    )
    await page.goto(`/dashboard/studio?draft=${id}`)
    await expect(page.locator('.design-layer')).toHaveCount(6)
    await expect(page.locator('#design-artboard')).toContainText(
      'Akosombo plant operations',
    )
    const jsonEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download design JSON' }).click()
    const json = JSON.parse(
      await readFile((await (await jsonEvent).path())!, 'utf8'),
    )
    expect(json.layers.at(-1).font).toBe('mono')
    const pngEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download canvas PNG' }).click()
    const png = await readFile((await (await pngEvent).path())!)
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(900)
    expect(png.length).toBeGreaterThan(5000)
    await page.screenshot({
      path: 'artifacts/canvas-desktop.png',
      fullPage: true,
      animations: 'disabled',
    })
    await page.setViewportSize({ width: 390, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: 'artifacts/canvas-mobile.png',
      fullPage: true,
      animations: 'disabled',
    })
    const ownerPage = await ownerContext.newPage()
    await login(ownerPage, owner.email!)
    await ownerPage.goto('/admin')
    await expect(ownerPage).toHaveURL(/\/dashboard\/admin/)
    await ownerPage.getByRole('tab', { name: 'Clients', exact: true }).click()
    await ownerPage.getByLabel('Find client by email').fill(client.email!)
    await ownerPage
      .getByRole('button', { name: 'Find client', exact: true })
      .click()
    await expect(ownerPage.locator('.directory-table tbody tr')).toHaveCount(1)
    await expect(ownerPage.locator('.directory-table')).toContainText(
      client.email!,
    )
    await ownerPage.screenshot({
      path: 'artifacts/owner-directory.png',
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await context.close()
    await ownerContext.close()
    await deleteApp(app)
  }
})

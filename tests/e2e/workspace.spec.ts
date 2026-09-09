import { test, expect, type Page } from '@playwright/test'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const password = 'AuraFlow-test-passphrase-123'
const unique = Date.now().toString(36)
const email = `client-${unique}@example.com`
let projectPath = ''
const adminApp = initializeApp({ projectId: 'demo-auraflow' }, 'browser-tests')

async function signIn(page: Page, address: string) {
  await page.goto('/login')
  await page.getByLabel('Email address', { exact: true }).fill(address)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy()
}

async function settledScreenshot(page: Page, path: string) {
  await expect(page.locator('h1').first()).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images, (img) => img.decode().catch(() => undefined)),
    )
  })
  await page.screenshot({ path, fullPage: true, animations: 'disabled' })
}

test('template filters, bookmarks, responsive preview, and request handoff', async ({
  page,
}) => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Run this test through Firebase emulators:exec.')
  const address = `library-${unique}@example.com`
  await getAuth(adminApp).createUser({
    email: address,
    password,
    displayName: 'Template Client',
  })
  await signIn(page, address)
  await page.goto('/dashboard/templates')
  await page
    .getByRole('tab', { name: 'Website templates', exact: true })
    .click()
  await page.getByLabel('Template category').selectOption('Restaurant')
  await page.getByLabel('Search templates').fill('Cafe')
  await expect(page.locator('.library-item')).toHaveCount(1)
  await page.getByRole('button', { name: /^Save / }).click()
  await expect(page.getByRole('button', { name: /^Unsave / })).toBeVisible()
  await page.reload()
  await page
    .getByRole('tab', { name: 'Website templates', exact: true })
    .click()
  await page.getByLabel('Search templates').fill('Cafe')
  await expect(page.getByRole('button', { name: /^Unsave / })).toBeVisible()
  await page.getByRole('button', { name: /^Unsave / }).click()
  await expect(page.getByRole('button', { name: /^Save / })).toBeVisible()
  await page.getByRole('button', { name: /^Save / }).click()
  await expect(page.getByRole('button', { name: /^Unsave / })).toBeVisible()
  await page.getByRole('tab', { name: 'Saved', exact: true }).click()
  await expect(page.locator('.library-item')).toHaveCount(1)
  await page.getByRole('link', { name: 'View template', exact: true }).click()
  await page
    .getByRole('button', { name: 'Mobile preview', exact: true })
    .click()
  const preview = page.locator('iframe').first()
  await expect(preview).toHaveCSS('width', '360px')
  await expect(preview).toHaveAttribute(
    'sandbox',
    'allow-forms allow-top-navigation-by-user-activation',
  )
  await settledScreenshot(page, 'artifacts/template-mobile-preview.png')
  await preview.scrollIntoViewIfNeeded()
  expect(
    await page
      .locator('main img')
      .evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
  ).toBeTruthy()
  await page
    .frameLocator('iframe')
    .getByRole('link', { name: 'Open private workspace', exact: true })
    .click()
  await expect(page).toHaveURL(/requests\/new\?template=cafe-restaurant/)
  await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible()
  await expect(page.getByText(/Starting with Cafe/)).toBeVisible()
})

test.describe.serial('AuraFlow rebuilt customer and admin workflows', () => {
  test('public routes, scroll, accessible login and mobile sizing', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /Business software/ }),
    ).toBeVisible()
    await settledScreenshot(page, 'artifacts/home-desktop.png')
    await page
      .getByRole('heading', { name: 'Good software should be within reach.' })
      .scrollIntoViewIfNeeded()
    await page
      .getByRole('heading', { name: 'What will you build?' })
      .scrollIntoViewIfNeeded()
    await expect(
      page.getByRole('heading', { name: 'What will you build?' }),
    ).toBeVisible()
    for (const path of [
      '/services',
      '/solutions',
      '/solutions/school-management-system',
      '/solutions/restaurant-ordering-booking',
      '/solutions/hotel-lodge-guesthouse-booking',
      '/templates',
      '/templates/cafe-restaurant',
      '/templates/general-practice-clinic',
      '/portfolio',
      '/pricing',
      '/about',
      '/blog',
      '/contact',
      '/login',
      '/register',
      '/forgot-password',
    ]) {
      await page.goto(path)
      await expect(page.locator('h1').first()).toBeVisible()
      await noOverflow(page)
    }
    await page.goto('/dashboard/studio?suite=school-management-system')
    await expect(page).toHaveURL(/\/login/)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/register')
    await noOverflow(page)
    await settledScreenshot(page, 'artifacts/register-mobile.png')
    await page.goto('/login')
    await settledScreenshot(page, 'artifacts/login-mobile.png')
    await page.getByLabel('Password', { exact: true }).fill('visible-password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'type',
      'text',
    )
    expect(errors).toEqual([])
  })

  test('register, support chat, save design, upload content and submit a project', async ({
    page,
  }) => {
    await page.goto('/register')
    await page.getByLabel('Full name', { exact: true }).fill('Ama Mensah')
    await page.getByLabel('Email address', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Confirm password', { exact: true }).fill(password)
    await page.getByRole('checkbox').check()
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole('heading', { name: 'Your next idea starts here' }),
    ).toBeVisible()
    await page.goto('/dashboard/messages')
    await page
      .getByRole('textbox', { name: 'Your message' })
      .fill('Hello, I want to build a school platform.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByRole('log')).toContainText(
      'Hello, I want to build a school platform.',
    )
    await page.goto('/dashboard/studio?suite=school-management-system')
    await page
      .getByLabel('Business name', { exact: true })
      .fill('Adinkra Academy')
    await page
      .getByLabel('Website headline')
      .fill('A bright beginning for every child')
    await page
      .getByLabel('Business description')
      .fill(
        'A school platform with admissions, attendance, fees, and a parent portal for our community.',
      )
    await page.getByRole('button', { name: 'Website', exact: true }).click()
    await expect(page.locator('.canvas-site-hero')).toContainText(
      'A bright beginning for every child',
    )
    await page.getByLabel('New page name').fill('Admissions')
    await page.getByRole('button', { name: 'Add page', exact: true }).click()
    await page
      .getByRole('button', { name: 'mobile preview', exact: true })
      .click()
    await expect(page.locator('.studio-preview-frame')).toHaveCSS(
      'max-width',
      '320px',
    )
    await page.getByRole('button', { name: 'Save design', exact: true }).click()
    await expect(page).toHaveURL(/draft=/)
    await page.reload()
    await expect(page.getByLabel('Business name', { exact: true })).toHaveValue(
      'Adinkra Academy',
    )
    await page.screenshot({
      path: 'artifacts/studio-desktop.png',
      fullPage: true,
    })
    await page.getByRole('tab', { name: 'Content', exact: true }).click()
    await page.getByLabel('Logo', { exact: true }).setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
        'base64',
      ),
    })
    await expect(
      page.getByText('File uploaded. Save your design to keep this reference.'),
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Create project brief', exact: true })
      .click()
    await expect(page).toHaveURL(/requests\/new\?draft=/)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByLabel('Project files').setInputFiles({
      name: 'brief.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('School admissions and reporting requirements.'),
    })
    await page
      .getByRole('button', { name: 'Review project', exact: true })
      .click()
    await page.getByRole('checkbox').check()
    await page
      .getByRole('button', { name: 'Submit project', exact: true })
      .click()
    await expect(page).toHaveURL(/\/dashboard\/requests\/[a-f0-9-]+$/)
    projectPath = new URL(page.url()).pathname
    await page.getByRole('tab', { name: 'Files', exact: true }).click()
    await expect(page.getByText('brief.txt', { exact: true })).toBeVisible()
    const download = page.waitForEvent('download')
    await page
      .getByRole('button', { name: 'Download brief.txt', exact: true })
      .click()
    expect((await download).suggestedFilename()).toBe('brief.txt')
    await page.getByLabel('Add a project file').setInputFiles({
      name: 'follow-up.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Additional brand and admissions requirements.'),
    })
    await page.getByRole('button', { name: 'Upload file', exact: true }).click()
    await expect(page.getByText('File added to your project.')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Download follow-up.txt', exact: true }),
    ).toBeVisible()
    await page
      .getByRole('tab', { name: 'Request changes', exact: true })
      .click()
    await page
      .getByRole('textbox', { name: 'Requested changes' })
      .fill(
        'Please add a separate admissions page with a clear application workflow.',
      )
    await page
      .getByRole('button', { name: 'Send revision request', exact: true })
      .click()
    await expect(
      page.getByText('Your revision request has been sent.'),
    ).toBeVisible()
    await page.goto('/dashboard')
    await expect(
      page.getByRole('link', { name: 'Adinkra Academy', exact: true }),
    ).toBeVisible()
    await settledScreenshot(page, 'artifacts/workspace-desktop.png')
  })

  test('admin receives support and project data, and replies to a client', async ({
    page,
  }) => {
    const address = `admin-${unique}@example.com`
    const admin = await getAuth(adminApp).createUser({
      email: address,
      password,
      displayName: 'Elisha Afari',
      emailVerified: true,
    })
    await getAuth(adminApp).setCustomUserClaims(admin.uid, { admin: true })
    await signIn(page, address)
    await page.goto('/dashboard/admin')
    await expect(
      page.getByRole('heading', { name: 'Administration' }),
    ).toBeVisible()
    await page.getByRole('tab', { name: 'Support inbox' }).click()
    await page.getByRole('button', { name: /Ama Mensah/ }).click()
    await expect(page.getByRole('log')).toContainText(
      'Hello, I want to build a school platform.',
    )
    await page
      .getByRole('textbox', { name: 'Your message' })
      .fill('Hello Ama, we can help you with that school platform.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByRole('log')).toContainText('Hello Ama, we can help')
    await page.getByRole('tab', { name: 'Projects', exact: true }).click()
    await page
      .getByRole('button', { name: 'Adinkra Academy', exact: true })
      .click()
    await page.getByLabel('Project status').selectOption('Building')
    await page
      .getByLabel('Progress update for client')
      .fill('We have started the admissions and parent portal work.')
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click()
    await expect(page.getByText('Project updated.')).toBeVisible()
    await page.getByLabel('Share a preview file').setInputFiles({
      name: 'design-preview.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
        'base64',
      ),
    })
    await expect(page.getByText('Preview shared with client.')).toBeVisible()
    await settledScreenshot(page, 'artifacts/admin-desktop.png')
  })

  test('client sees updates, themes work, mobile navigation works, and another account cannot read the project', async ({
    page,
  }) => {
    await signIn(page, email)
    await page.goto(projectPath)
    await expect(
      page.getByText('We have started the admissions and parent portal work.'),
    ).toBeVisible()
    await page.getByRole('tab', { name: 'Previews', exact: true }).click()
    await expect(
      page.getByRole('img', { name: 'design-preview.png', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: 'design-preview.png', exact: true }),
    ).toHaveJSProperty('naturalWidth', 1)
    await page.goto('/dashboard/settings')
    await page.getByRole('button', { name: 'Light', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: 'Dark', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.setViewportSize({ width: 390, height: 844 })
    await noOverflow(page)
    await page.getByRole('button', { name: 'Open workspace menu' }).click()
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'Messages', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Messages', exact: true }),
    ).toBeVisible()
    await noOverflow(page)
    await page.screenshot({
      path: 'artifacts/messages-mobile.png',
      fullPage: true,
    })
    await page.goto('/dashboard/settings')
    await page
      .getByRole('button', { name: 'Sign out', exact: true })
      .last()
      .click()
    await expect(page).toHaveURL(/\/login/)
    const other = await getAuth(adminApp).createUser({
      email: `other-${unique}@example.com`,
      password,
    })
    await signIn(page, other.email!)
    await page.goto(projectPath)
    await expect(page.getByRole('alert')).toContainText(
      'Unable to load this data',
    )
    await expect(
      page.getByRole('heading', { name: 'Adinkra Academy' }),
    ).toHaveCount(0)
    await page.goto('/dashboard/admin')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test('Google popup sign-in returns to the requested workspace and handles a broken avatar', async ({
  page,
}) => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Run this test through Firebase emulators:exec.')
  await page.goto('/dashboard/studio?suite=restaurant-ordering-booking')
  await expect(page).toHaveURL(/\/login/)
  const popupReady = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  const popup = await popupReady
  await popup.waitForLoadState('load')
  await popup.locator('.js-new-account').click()
  await popup.locator('#email-input').fill(`google-${unique}@example.com`)
  await popup.locator('#display-name-input').fill('Kofi Asante')
  await popup
    .locator('#profile-photo-input')
    .fill('http://127.0.0.1:5187/missing-avatar.png')
  await popup.locator('#main-form button[type="submit"]').click()
  await expect(page).toHaveURL(/studio\?suite=restaurant-ordering-booking/)
  await expect(
    page.getByRole('heading', { name: 'Design studio' }),
  ).toBeVisible()
  await expect(page.locator('.account-row')).toContainText('Kofi Asante')
  await expect(page.locator('.account-row [role="img"]')).toContainText('KA')
})

test('registration validation, rejected credentials, and password reset delivery', async ({
  page,
}) => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Run this test through Firebase emulators:exec.')
  await page.goto('/register')
  await page.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(page.getByRole('alert')).toContainText('Please accept the terms')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(
    page.getByLabel('Email address', { exact: true }),
  ).toHaveAttribute('aria-invalid', 'true')
  const address = `reset-${unique}@example.com`
  await getAuth(adminApp).createUser({ email: address, password })
  await page.goto('/login')
  await page.getByLabel('Email address', { exact: true }).fill(address)
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await page.getByLabel('Email address', { exact: true }).fill(address)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(
    page.getByRole('heading', { name: 'Check your email' }),
  ).toBeVisible()
  const response = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/demo-auraflow/oobCodes`,
  )
  const payload = (await response.json()) as {
    oobCodes: Array<{ email: string; requestType: string }>
  }
  expect(
    payload.oobCodes.some(
      (code) => code.email === address && code.requestType === 'PASSWORD_RESET',
    ),
  ).toBeTruthy()
})

test('a stale editor cannot silently overwrite a newer saved design', async ({
  page,
  context,
}) => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Run this test through Firebase emulators:exec.')
  const address = `designer-${unique}@example.com`
  await getAuth(adminApp).createUser({
    email: address,
    password,
    displayName: 'Esi Designer',
  })
  await signIn(page, address)
  await page.goto('/dashboard/studio?suite=school-management-system')
  await page
    .getByLabel('Business name', { exact: true })
    .fill('Versioned school')
  await page.getByRole('button', { name: 'Save design', exact: true }).click()
  await expect(page).toHaveURL(/draft=/)
  const other = await context.newPage()
  await other.goto(page.url())
  await expect(other.getByLabel('Business name', { exact: true })).toHaveValue(
    'Versioned school',
  )
  await page.getByLabel('Business name', { exact: true }).fill('Newest school')
  await page.getByRole('button', { name: 'Save design', exact: true }).click()
  await expect(page.getByText('Saved · Version 2')).toBeVisible()
  await other.getByLabel('Business name', { exact: true }).fill('Stale school')
  await other.getByRole('button', { name: 'Save design', exact: true }).click()
  await expect(
    other.getByText('This design changed in another tab.', { exact: false }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Business name', { exact: true })).toHaveValue(
    'Newest school',
  )
})

test('suite-specific canvas, brand controls, page navigation, and mobile studio', async ({
  page,
}) => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error('Run this test through Firebase emulators:exec.')
  const address = `canvas-${unique}@example.com`
  await getAuth(adminApp).createUser({
    email: address,
    password,
    displayName: 'Canvas Client',
  })
  await signIn(page, address)
  await page.goto('/dashboard/studio?suite=clinic-patient-portal')
  await page.getByRole('button', { name: 'System', exact: true }).click()
  const canvas = page.locator('.suite-canvas')
  await expect(canvas).toContainText('Appointments')
  await expect(canvas).not.toContainText('#AF-1028')
  await page.getByLabel('Search preview records').fill('Appointments')
  await expect(canvas.locator('tbody tr')).toHaveCount(1)
  await page
    .getByRole('button', { name: 'Preview Appointments', exact: true })
    .click()
  await expect(
    page.getByRole('region', { name: 'Preview record details' }),
  ).toContainText('Healthcare')
  await page.getByRole('button', { name: 'Close preview details' }).click()
  await page.getByLabel('Business name', { exact: true }).fill('Akwaaba Care')
  await page.getByLabel('Website headline').fill('Care for our community')
  await page
    .getByLabel('Business description')
    .fill('Appointments and care for families in our community.')
  await page.getByLabel('Primary color', { exact: true }).fill('#336699')
  await page.getByLabel('Accent color', { exact: true }).fill('#008877')
  await expect(canvas).toHaveCSS('--canvas-primary', '#336699')
  await expect(canvas).toHaveCSS('--canvas-accent', '#008877')
  await page.getByRole('button', { name: 'Website', exact: true }).click()
  await expect(canvas).toContainText('Care for our community')
  await expect(canvas).toContainText('Appointments and care for families')
  await page.getByLabel('New page name').fill('Care team')
  await page.getByRole('button', { name: 'Add page', exact: true }).click()
  await canvas.getByRole('button', { name: 'Home', exact: true }).click()
  await canvas.getByRole('button', { name: 'Care team', exact: true }).click()
  await expect(canvas.locator('.canvas-site-hero small')).toHaveText(
    'Care team',
  )
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(canvas).toHaveClass(/suite-canvas-dark/)
  await page
    .getByRole('button', { name: 'mobile preview', exact: true })
    .click()
  await page.setViewportSize({ width: 390, height: 844 })
  await noOverflow(page)
  await canvas.scrollIntoViewIfNeeded()
  await page
    .locator('.studio-canvas-area')
    .screenshot({ path: 'artifacts/studio-mobile.png', animations: 'disabled' })
})

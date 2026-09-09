import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { chromium } from '@playwright/test'

const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '5191',
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
)
let browser
try {
  for (let attempt = 0; ; attempt++) {
    if (server.exitCode !== null)
      throw new Error(
        'The production preview server could not start on port 5191.',
      )
    try {
      await fetch('http://127.0.0.1:5191')
      break
    } catch {
      if (attempt >= 100)
        throw new Error('Production preview did not become ready.')
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const route of [
    '/',
    '/login',
    '/register',
    '/solutions',
    '/templates/cafe-restaurant',
    '/pricing',
    '/about',
  ]) {
    await page.goto(`http://127.0.0.1:5191${route}`)
    await page.locator('h1').first().waitFor()
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Overflow on ${route}`,
    )
  }
  await page.goto('http://127.0.0.1:5191/templates')
  await page
    .getByRole('tab', { name: 'Website templates', exact: true })
    .click()
  await page.getByLabel('Search templates').fill('Cafe')
  await page.getByRole('link', { name: 'View template', exact: true }).click()
  await page
    .getByRole('button', { name: 'Mobile preview', exact: true })
    .click()
  await page.locator('iframe').scrollIntoViewIfNeeded()
  await page
    .frameLocator('iframe')
    .getByRole('link', {
      name: 'Open private workspace',
      exact: true,
    })
    .click()
  await page.waitForURL('http://127.0.0.1:5191/login')
  await page.getByLabel('Email address', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log(
    'Production bundle smoke passed: public routes, no runtime errors or horizontal overflow, and template preview handoff to sign-in.',
  )
} finally {
  await browser?.close()
  if (server.exitCode === null) {
    const stopped = once(server, 'exit')
    server.kill()
    await stopped
  }
}

import { expect, test } from '@playwright/test'

test('AFC public landing, catalog, and certificate verifier resolve', async ({ page }) => {
  await page.goto('/afc')
  await expect(page.getByRole('link', { name: 'Explore programs' }).first()).toBeVisible()

  await page.goto('/afc/catalog')
  await expect(page.getByRole('heading', { name: 'Find the next useful thing to learn.' })).toBeVisible()

  await page.goto('/afc/verify')
  await expect(page.getByRole('heading', { name: 'Verify an AFC certificate.' })).toBeVisible()
  await expect(page.getByLabel('Certificate code')).toBeVisible()
})

import { test, expect } from '@playwright/test'

test.describe('/health', () => {
  test('correctly loads and displays connection health', async ({ page }) => {
    await page.goto('/health')

    const status = page.getByLabel('connection-status')
    await expect(status).toHaveText("just fine n' dandy")
  })
})

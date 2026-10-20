import { test, expect } from '@playwright/test'

/*
Each demo run creates 5 users, and each playwright test runs 3 times. To reduce
bloating, only a basic demo flow will be tested.
*/

test('signs in as a demo guest and accepts the invite', async ({ page }) => {
  await page.goto('/')

  // Sign in as a demo guest
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page
    .getByRole('button', { name: 'Just here to browse? Try a demo account!' })
    .click()
  // new page, already seeded
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByRole('link', { name: 'Portfolio Website' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Mobile App Launch' }),
  ).toBeVisible()
  await expect(page.getByText('Hire Kacy', { exact: true })).toBeVisible()
  // accept the waiting invite
  await page.getByRole('button', { name: 'Accept' }).click()

  await expect(page.getByRole('link', { name: 'Hire Kacy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0)
})

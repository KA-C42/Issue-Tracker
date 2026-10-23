import { test, expect } from '@playwright/test'

// consider extracting to POM once more tests are added
test('signs up and creates a project', async ({ page }) => {
  const projectTitle = 'E2E test project'

  await page.goto('/')

  // Sign up
  await expect(page).toHaveURL(/\/auth$/)
  await page.getByRole('button', { name: 'Sign up', exact: true }).click()
  await page.getByLabel('Email').fill(`playwright+${Date.now()}@e2e.test`)
  await page.getByLabel('Password').fill('testeeee')
  // only exists in sign-up mode, so this also confirms the toggle worked
  await page.getByRole('button', { name: 'Create account' }).click()
  // new page
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  // open/use form
  await page.getByRole('button', { name: 'New Project' }).click()
  await page.getByLabel('title').fill(projectTitle)
  await page.getByLabel('code').fill('EETP')
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByRole('link', { name: projectTitle })).toBeVisible()
})

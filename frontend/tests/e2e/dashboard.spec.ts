import { randomUUID } from 'node:crypto'
import { test, expect, signUp } from './fixtures'
import { DashboardPage } from './pages/DashboardPage'

// smoke test for fixtures.ts
test('each fixture page is logged in as its own account', async ({
  page,
  owner,
  contributorPage,
  contributor,
  outsiderPage,
  outsider,
}) => {
  const pages = [
    [page, owner],
    [contributorPage, contributor],
    [outsiderPage, outsider],
  ] as const

  for (const [rolePage, account] of pages) {
    const dashboard = new DashboardPage(rolePage)
    await dashboard.goto()
    await expect(dashboard.accountMenu).toHaveText(account.username)
  }
})

// own account: renaming a shared one breaks later tests that expect its
// fixture username
test('editing the username persists after a reload', async ({
  browser,
  baseURL,
}) => {
  const account = await signUp('rename')
  const context = await browser.newContext({
    baseURL,
    storageState: account.storageState,
  })
  const page = await context.newPage()
  // max 20 chars, no spaces
  const username = `renamed_${randomUUID().slice(0, 8)}`

  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await dashboard.submitUsernameForm(username)

  await expect(dashboard.editUsernameDialog).toBeHidden()
  await expect(dashboard.accountMenu).toHaveText(username)
  await page.reload()
  await expect(dashboard.accountMenu).toHaveText(username)
  await context.close()
})

// usernames are unique in the DB, so this checks the whole
// constraint -> API error -> form message path
test('a taken username shows an error and keeps the form open', async ({
  page,
  contributor,
}) => {
  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await dashboard.submitUsernameForm(contributor.username)

  await expect(dashboard.editUsernameDialog).toContainText(/already in use/i)
  await expect(dashboard.editUsernameDialog).toBeVisible()
})

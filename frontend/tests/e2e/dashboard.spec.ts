import { test, expect } from './fixtures'
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

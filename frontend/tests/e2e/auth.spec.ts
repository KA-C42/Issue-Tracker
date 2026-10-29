import { randomUUID } from 'node:crypto'
import { test, expect, signUp } from './fixtures'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('logged out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('signing up lands on the dashboard with a generated username', async ({
    page,
  }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signUp(`playwright+signup-${randomUUID()}@e2e.test`, 'password')

    const dashboard = new DashboardPage(page)
    await expect(dashboard.heading).toBeVisible()
    // new accounts get 'user_' + 6 chars (002_create_profiles.sql)
    await expect(dashboard.accountMenu).toHaveText(/^user_\w{6}$/)
  })

  test('signing in with valid credentials lands on the dashboard', async ({
    page,
    owner,
  }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signIn(owner.email, owner.password)

    const dashboard = new DashboardPage(page)
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.accountMenu).toHaveText(owner.username)
  })

  test('invalid credentials show an error', async ({ page, owner }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signIn(owner.email, 'wrong-password')

    await expect(page.getByText(/invalid login credentials/i)).toBeVisible()
    await expect(page).toHaveURL(/\/auth$/)
  })

  test('protected pages redirect to sign in', async ({ page }) => {
    for (const path of ['/', `/projects/${randomUUID()}`]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth$/)
    }
  })
})

// own account: signing out revokes the session for everyone using it
test('signing out returns to sign in and blocks protected pages', async ({
  browser,
  baseURL,
}) => {
  const account = await signUp('signout')
  const context = await browser.newContext({
    baseURL,
    storageState: account.storageState,
  })
  const page = await context.newPage()

  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await dashboard.signOut()
  await expect(page).toHaveURL(/\/auth$/)

  await page.goto('/')
  await expect(page).toHaveURL(/\/auth$/)
  await context.close()
})

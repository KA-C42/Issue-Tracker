import { expect, type Locator, type Page } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly accountMenu: Locator
  readonly signOutItem: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Projects' })
    // navbar's only button; its text is the username
    this.accountMenu = page.getByRole('navigation').getByRole('button')
    // only rendered while the account menu is open
    this.signOutItem = page.getByRole('menuitem', { name: 'Sign out' })
  }

  async goto() {
    await this.page.goto('/')
    await expect(this.heading).toBeVisible()
  }

  async signOut() {
    await this.accountMenu.click()
    await this.signOutItem.click()
  }
}

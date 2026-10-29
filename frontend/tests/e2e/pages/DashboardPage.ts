import { expect, type Locator, type Page } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly newProjectButton: Locator
  readonly ownedProjects: Locator
  readonly contributingProjects: Locator
  readonly pendingInvites: Locator
  readonly createProjectDialog: Locator
  readonly accountMenu: Locator
  readonly editUsernameItem: Locator
  readonly signOutItem: Locator
  readonly editUsernameDialog: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Projects' })
    this.newProjectButton = page.getByRole('button', { name: 'New Project' })
    this.ownedProjects = page.getByRole('region', { name: 'Owned Projects' })
    this.contributingProjects = page.getByRole('region', {
      name: 'Contributing Projects',
    })
    this.pendingInvites = page.getByRole('region', { name: 'Pending Invites' })
    this.createProjectDialog = page.getByRole('dialog', {
      name: 'Create Project',
    })
    // navbar's only button; its text is the username
    this.accountMenu = page.getByRole('navigation').getByRole('button')
    // menu items are only rendered while the account menu is open
    this.editUsernameItem = page.getByRole('menuitem', {
      name: 'Edit Username',
    })
    this.signOutItem = page.getByRole('menuitem', { name: 'Sign out' })
    this.editUsernameDialog = page.getByRole('dialog', {
      name: 'Edit Username',
    })
  }

  async goto() {
    await this.page.goto('/')
    await expect(this.heading).toBeVisible()
  }

  async submitProjectForm(title: string, code: string) {
    await this.newProjectButton.click()
    await this.createProjectDialog.getByLabel('Project Title').fill(title)
    await this.createProjectDialog.getByLabel('Issue Code').fill(code)
    await this.createProjectDialog
      .getByRole('button', { name: 'Submit' })
      .click()
  }

  async createProject(title: string, code: string) {
    await this.submitProjectForm(title, code)
    // the dialog only closes on success
    await expect(this.createProjectDialog).toBeHidden()
  }

  projectLink(section: Locator, title: string) {
    return section.getByRole('link', { name: title })
  }

  async submitUsernameForm(username: string) {
    await this.accountMenu.click()
    await this.editUsernameItem.click()
    await this.editUsernameDialog.getByLabel('Username').fill(username)
    await this.editUsernameDialog
      .getByRole('button', { name: 'Submit' })
      .click()
  }

  async signOut() {
    await this.accountMenu.click()
    await this.signOutItem.click()
  }
}

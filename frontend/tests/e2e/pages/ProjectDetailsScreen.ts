import { expect, type Locator, type Page } from '@playwright/test'

export class ProjectDetailsScreen {
  readonly page: Page
  readonly title: Locator
  readonly editButton: Locator
  readonly editDialog: Locator
  readonly deleteButton: Locator
  readonly leaveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { level: 1 })
    // owners see Edit and Delete, contributors see Leave. exact, or they
    // also match the confirm dialogs' Delete/Leave project buttons
    this.editButton = page.getByRole('button', { name: 'Edit', exact: true })
    this.editDialog = page.getByRole('dialog', { name: 'Edit Project' })
    this.deleteButton = page.getByRole('button', {
      name: 'Delete',
      exact: true,
    })
    this.leaveButton = page.getByRole('button', { name: 'Leave', exact: true })
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/details`)
    await expect(this.title).toBeVisible()
  }

  // confirm dialogs are named after the project
  deleteDialog(title: string) {
    return this.page.getByRole('dialog', { name: `Delete '${title}'?` })
  }

  leaveDialog(title: string) {
    return this.page.getByRole('dialog', { name: `Leave '${title}'?` })
  }

  async editProject(fields: { title: string; description: string }) {
    await this.editButton.click()
    await this.editDialog.getByLabel('Project Title').fill(fields.title)
    await this.editDialog.getByLabel('Description').fill(fields.description)
    await this.editDialog.getByRole('button', { name: 'Save' }).click()
    // the dialog only closes on success
    await expect(this.editDialog).toBeHidden()
  }

  async deleteProject(title: string) {
    await this.deleteButton.click()
    const dialog = this.deleteDialog(title)
    // stays disabled until the title is typed
    await dialog.getByRole('textbox').fill(title)
    await dialog.getByRole('button', { name: 'Delete project' }).click()
  }

  async leaveProject(title: string) {
    await this.leaveButton.click()
    await this.leaveDialog(title)
      .getByRole('button', { name: 'Leave project' })
      .click()
  }
}

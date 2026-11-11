import { expect, type Locator, type Page } from '@playwright/test'

export class ProjectDetailsScreen {
  readonly page: Page
  readonly editButton: Locator
  readonly editDialog: Locator
  readonly deleteButton: Locator
  readonly leaveButton: Locator

  constructor(page: Page) {
    this.page = page
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
    await expect(this.page.getByText('Issue code')).toBeVisible()
  }

  // confirm dialogs are named after the project
  deleteDialog(title: string) {
    return this.page.getByRole('dialog', { name: `Delete '${title}'?` })
  }

  leaveDialog(title: string) {
    return this.page.getByRole('dialog', { name: `Leave '${title}'?` })
  }

  async leaveProject(title: string) {
    await this.leaveButton.click()
    await this.leaveDialog(title)
      .getByRole('button', { name: 'Leave project' })
      .click()
  }
}

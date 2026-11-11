import { expect, type Locator, type Page } from '@playwright/test'
import type { Comment } from '@issue-tracker/shared'

export class IssueDetailScreen {
  readonly page: Page
  readonly title: Locator
  readonly editTitleButton: Locator
  readonly titleInput: Locator
  readonly editDetailsButton: Locator
  readonly detailsInput: Locator
  readonly saveButton: Locator
  readonly statusSelect: Locator
  readonly assigneeSelect: Locator
  readonly comments: Locator
  readonly commentInput: Locator
  readonly commentButton: Locator
  readonly deleteButton: Locator
  readonly deleteDialog: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByRole('heading', { level: 1 })
    this.editTitleButton = page.getByRole('button', { name: 'Edit title' })
    this.titleInput = page.getByRole('textbox', { name: 'Title' })
    this.editDetailsButton = page.getByRole('button', { name: 'Edit details' })
    this.detailsInput = page.getByRole('textbox', { name: 'Details' })
    // only one field is edited at a time, so there's only one Save
    this.saveButton = page.getByRole('button', { name: 'Save' })
    this.statusSelect = page.getByRole('combobox', { name: 'Status' })
    this.assigneeSelect = page.getByRole('combobox', { name: 'Assignee' })
    this.comments = page.getByRole('region', { name: 'Comments' })
    this.commentInput = page.getByPlaceholder('Add a comment')
    // exact, or it also matches each card's Edit/Delete comment buttons
    this.commentButton = page.getByRole('button', {
      name: 'Comment',
      exact: true,
    })
    this.deleteButton = page.getByRole('button', { name: 'Delete issue' })
    this.deleteDialog = page.getByRole('dialog', { name: 'Delete this issue?' })
  }

  async goto(projectId: string, issueId: string) {
    await this.page.goto(`/projects/${projectId}/issues/${issueId}`)
    await expect(this.statusSelect).toBeVisible()
  }

  async editTitle(title: string) {
    await this.editTitleButton.click()
    await this.titleInput.fill(title)
    await this.saveButton.click()
    // the input only closes once the save succeeds
    await expect(this.titleInput).toBeHidden()
  }

  async editDetails(details: string) {
    await this.editDetailsButton.click()
    await this.detailsInput.fill(details)
    await this.saveButton.click()
    await expect(this.detailsInput).toBeHidden()
  }

  async assign(username: string) {
    // stays disabled until the member list loads
    await this.assigneeSelect.click()
    await this.page.getByRole('option', { name: username }).click()
    // the select shows the saved issue, so this waits for the save
    await expect(this.assigneeSelect).toHaveText(username)
  }

  comment(text: string) {
    return this.comments.getByRole('listitem').filter({ hasText: text })
  }

  // returns the saved comment, for checks against its timestamps
  async postComment(text: string): Promise<Comment> {
    const posted = this.page.waitForResponse(
      (res) =>
        res.url().endsWith('/comments') && res.request().method() === 'POST',
    )
    await this.commentInput.fill(text)
    await this.commentButton.click()
    const res = await posted
    expect(res.ok()).toBe(true)
    await expect(this.comment(text)).toBeVisible()
    return res.json()
  }

  async editComment(text: string, newText: string) {
    await this.comment(text)
      .getByRole('button', { name: 'Edit comment' })
      .click()
    // the card's text moves into the textarea, so it can't be found by text
    // until saved. only one comment is edited at a time
    const input = this.comments.getByRole('textbox', {
      name: 'Comment',
      exact: true,
    })
    await input.fill(newText)
    await this.comments.getByRole('button', { name: 'Save' }).click()
    await expect(input).toBeHidden()
  }

  async deleteComment(text: string) {
    await this.comment(text)
      .getByRole('button', { name: 'Delete comment' })
      .click()
    await expect(this.comment(text)).toHaveCount(0)
  }

  async deleteIssue() {
    await this.deleteButton.click()
    await this.deleteDialog.getByRole('button', { name: 'Delete' }).click()
  }
}

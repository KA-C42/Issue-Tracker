import { expect, type Locator, type Page } from '@playwright/test'
import type { IssueStatus } from '@issue-tracker/shared'

type Column = 'Backlog' | 'In Progress' | 'Done'

// each column's droppable id is its status (see DroppableCardBox)
const COLUMN_STATUS: Record<Column, IssueStatus> = {
  Backlog: 'BACKLOG',
  'In Progress': 'IN_PROGRESS',
  Done: 'DONE',
}

export class IssueScreen {
  readonly page: Page
  readonly heading: Locator
  readonly newIssueButton: Locator
  readonly createIssueDialog: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Issues' })
    this.newIssueButton = page.getByRole('button', { name: 'New Issue' })
    this.createIssueDialog = page.getByRole('dialog', { name: 'Create Issue' })
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`)
    await expect(this.heading).toBeVisible()
    await expect(
      this.page.getByRole('status', { name: 'Loading' }),
    ).toHaveCount(0)
  }

  column(name: Column) {
    return this.page.getByRole('region', { name })
  }

  // a card is one link; its name includes the code, title and assignee
  card(column: Column, title: string) {
    return this.column(column).getByRole('link', { name: title })
  }

  dragHandle(title: string) {
    return this.page.getByRole('button', { name: `Drag ${title}` })
  }

  async createIssue(title: string) {
    await this.newIssueButton.click()
    await this.createIssueDialog.getByLabel('Issue Title').fill(title)
    await this.createIssueDialog.getByRole('button', { name: 'Submit' }).click()
    // the dialog only closes on success
    await expect(this.createIssueDialog).toBeHidden()
  }

  async dragCard(title: string, to: Column) {
    // the card moves optimistically, so wait for the save itself or a
    // reload right after could cancel it
    const saved = this.page.waitForResponse(
      (res) =>
        res.url().endsWith('/status') && res.request().method() === 'PATCH',
    )

    const target = await this.column(to).boundingBox()
    if (!target) throw new Error(`${to} column is not visible`)

    await this.dragHandle(title).hover()
    await this.page.mouse.down()
    // dnd-kit needs moves in between to start the drag and find the column
    await this.page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height / 2,
      { steps: 10 },
    )
    // it settles the drop target a beat after the pointer arrives, and
    // releasing first drops the card back on itself (seen in webkit). its
    // screen reader announcement says when the column is the target
    await expect(
      this.page.getByRole('status').filter({ hasText: 'droppable target' }),
    ).toContainText(`moved over droppable target ${COLUMN_STATUS[to]}`)
    await this.page.mouse.up()

    expect((await saved).ok()).toBe(true)
  }
}

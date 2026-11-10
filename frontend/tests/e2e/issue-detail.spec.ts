import { test, expect } from './fixtures'
import { createIssue, createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { IssueDetailScreen } from './pages/IssueDetailScreen'
import { IssueScreen } from './pages/IssueScreen'

test('edits to an issue persist and show on the board', async ({
  page,
  owner,
}) => {
  const project = await createProject(owner, {
    title: uniqueName('Detail edit'),
    code: 'DTLE',
  })
  const issue = await createIssue(owner, project.id, {
    title: uniqueName('Edit issue'),
  })
  const newTitle = uniqueName('Edited issue')

  const detail = new IssueDetailScreen(page)
  await detail.goto(project.id, issue.id)
  await detail.editTitle(newTitle)
  await detail.editDetails('Steps to reproduce')
  await detail.assign(owner.username)

  await page.reload()
  await expect(detail.title).toHaveText(newTitle)
  await expect(page.getByText('Steps to reproduce')).toBeVisible()
  await expect(detail.assigneeSelect).toHaveText(owner.username)

  const board = new IssueScreen(page)
  await board.goto(project.id)
  await expect(board.card('Backlog', newTitle)).toContainText(owner.username)
})

test('a deleted issue is removed from the board', async ({ page, owner }) => {
  const project = await createProject(owner, {
    title: uniqueName('Detail delete'),
    code: 'DTLD',
  })
  const title = uniqueName('Delete issue')
  const issue = await createIssue(owner, project.id, { title })

  const detail = new IssueDetailScreen(page)
  await detail.goto(project.id, issue.id)
  await detail.deleteIssue()

  // deleting sends you back to the board
  await expect(page).toHaveURL(new RegExp(`/projects/${project.id}$`))

  // a fresh load, so the card isn't just missing from the cache
  const board = new IssueScreen(page)
  await board.goto(project.id)
  await expect(board.card('Backlog', title)).toHaveCount(0)
})

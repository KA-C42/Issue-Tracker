import { test, expect } from './fixtures'
import { createIssue, createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { IssueScreen } from './pages/IssueScreen'

test('a new issue shows in Backlog with its code', async ({ page, owner }) => {
  const project = await createProject(owner, {
    title: uniqueName('Board create'),
    code: 'BRDC',
  })
  const title = uniqueName('Create issue')

  const board = new IssueScreen(page)
  await board.goto(project.id)
  await board.createIssue(title)

  const card = board.card('Backlog', title)
  await expect(card).toBeVisible()
  // codes count up per project, so the first issue is always 1
  await expect(card).toContainText('BRDC-1')
})

test('a dragged card stays in its new column after reload', async ({
  page,
  owner,
}) => {
  const project = await createProject(owner, {
    title: uniqueName('Board drag'),
    code: 'BRDD',
  })
  const title = uniqueName('Drag issue')
  await createIssue(owner, project.id, { title })

  const board = new IssueScreen(page)
  await board.goto(project.id)
  await board.dragCard(title, 'In Progress')
  await expect(board.card('In Progress', title)).toBeVisible()
  await board.dragCard(title, 'Done')
  await expect(board.card('Done', title)).toBeVisible()

  await page.reload()
  await expect(board.card('Done', title)).toBeVisible()
})

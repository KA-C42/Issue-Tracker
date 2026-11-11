import { test, expect } from './fixtures'
import { createComment, createIssue, createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { IssueDetailScreen } from './pages/IssueDetailScreen'

test('a posted comment shows its author and time', async ({ page, owner }) => {
  const project = await createProject(owner, {
    title: uniqueName('Comment post'),
    code: 'CMTP',
  })
  const issue = await createIssue(owner, project.id, {
    title: uniqueName('Comment issue'),
  })
  const text = uniqueName('Posted comment')

  const detail = new IssueDetailScreen(page)
  await detail.goto(project.id, issue.id)
  const saved = await detail.postComment(text)

  // the app shows the browser's locale, so format it the same way
  const createdAt = await page.evaluate(
    (iso) => new Date(iso).toLocaleString(),
    saved.created_at,
  )

  await page.reload()
  const comment = detail.comment(text)
  await expect(comment).toContainText(owner.username)
  await expect(comment).toContainText(createdAt)
})

test('the author can edit and then delete their comment', async ({
  page,
  owner,
}) => {
  const project = await createProject(owner, {
    title: uniqueName('Comment edit'),
    code: 'CMTE',
  })
  const issue = await createIssue(owner, project.id, {
    title: uniqueName('Comment issue'),
  })
  const text = uniqueName('Original comment')
  const newText = uniqueName('Edited comment')
  await createComment(owner, issue.id, text)

  const detail = new IssueDetailScreen(page)
  await detail.goto(project.id, issue.id)
  await detail.editComment(text, newText)
  await expect(detail.comment(newText)).toContainText('(edited at')

  await detail.deleteComment(newText)
  await page.reload()
  await expect(detail.comments).toContainText('Nothing here yet.')
})

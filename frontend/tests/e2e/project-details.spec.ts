import { test, expect } from './fixtures'
import { createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectDetailsScreen } from './pages/ProjectDetailsScreen'

test('edits to a project persist', async ({ page, owner }) => {
  const project = await createProject(owner, {
    title: uniqueName('Details edit'),
    code: 'PDTE',
  })
  const newTitle = uniqueName('Details edited')

  const details = new ProjectDetailsScreen(page)
  await details.goto(project.id)
  await details.editProject({
    title: newTitle,
    description: 'The new vision',
  })

  await page.reload()
  await expect(details.title).toHaveText(newTitle)
  await expect(page.getByText('The new vision')).toBeVisible()
})

test('a deleted project is gone from the dashboard', async ({
  page,
  owner,
}) => {
  const title = uniqueName('Details delete')
  const project = await createProject(owner, { title, code: 'PDTD' })

  const details = new ProjectDetailsScreen(page)
  await details.goto(project.id)
  await details.deleteProject(title)
  // only navigates once the delete succeeds
  await expect(page).toHaveURL('/')

  // deleting also edits the cached lists, so reload to check the server
  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await expect(
    dashboard.projectLink(dashboard.ownedProjects, title),
  ).toHaveCount(0)
})

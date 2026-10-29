import { test, expect } from './fixtures'
import { createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { DashboardPage } from './pages/DashboardPage'

test('a project created from the dashboard shows under Owned Projects', async ({
  page,
}) => {
  const dashboard = new DashboardPage(page)
  const title = uniqueName('Create test')

  await dashboard.goto()
  await dashboard.createProject(title, 'CRTE')

  await expect(
    dashboard.projectLink(dashboard.ownedProjects, title),
  ).toBeVisible()
  await expect(
    dashboard.projectLink(dashboard.contributingProjects, title),
  ).toHaveCount(0)
})

test('opens a project from the dashboard', async ({ page, owner }) => {
  const title = uniqueName('Open test')
  const project = await createProject(owner, { title, code: 'OPEN' })

  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await dashboard.projectLink(dashboard.ownedProjects, title).click()

  await expect(page).toHaveURL(`/projects/${project.id}`)
  await expect(page.getByRole('navigation')).toContainText(title)
})

// title uniqueness is enforced by the DB, so this checks the whole
// constraint -> API error -> form message path
test('a duplicate title shows an error and keeps the form open', async ({
  page,
  owner,
}) => {
  const title = uniqueName('Duplicate test')
  await createProject(owner, { title, code: 'DUPE' })

  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await dashboard.submitProjectForm(title, 'DUPE')

  await expect(dashboard.createProjectDialog).toContainText(/already in use/i)
  await expect(dashboard.createProjectDialog).toBeVisible()
})

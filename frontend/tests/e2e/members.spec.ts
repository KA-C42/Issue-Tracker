import { test, expect } from './fixtures'
import { addContributor, createProject } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { DashboardPage } from './pages/DashboardPage'
import { MemberScreen } from './pages/MemberScreen'
import { ProjectDetailsScreen } from './pages/ProjectDetailsScreen'

test('a removed contributor loses the project', async ({
  page,
  owner,
  contributorPage,
  contributor,
}) => {
  const title = uniqueName('Member remove')
  const project = await createProject(owner, { title, code: 'MBRR' })
  await addContributor(owner, project.id, contributor)

  // check they had it first, so the check after removing means something
  const dashboard = new DashboardPage(contributorPage)
  await dashboard.goto()
  const projectLink = dashboard.projectLink(
    dashboard.contributingProjects,
    title,
  )
  await expect(projectLink).toBeVisible()

  const members = new MemberScreen(page)
  await members.goto(project.id)
  await members.removeMember(contributor.username)
  await expect(members.member(contributor.username)).toHaveCount(0)
  await expect(members.member(owner.username)).toBeVisible()

  await dashboard.goto()
  await expect(projectLink).toHaveCount(0)
})

test('a contributor who leaves loses the project', async ({
  page,
  owner,
  contributorPage,
  contributor,
}) => {
  const title = uniqueName('Member leave')
  const project = await createProject(owner, { title, code: 'MBRL' })
  await addContributor(owner, project.id, contributor)

  // the Leave button only shows to a member, so seeing it is the before check
  const details = new ProjectDetailsScreen(contributorPage)
  await details.goto(project.id)
  await details.leaveProject(title)
  await expect(contributorPage).toHaveURL('/')

  // leaving also edits the cached lists, so reload to check the server
  const dashboard = new DashboardPage(contributorPage)
  await dashboard.goto()
  await expect(
    dashboard.projectLink(dashboard.contributingProjects, title),
  ).toHaveCount(0)

  const members = new MemberScreen(page)
  await members.goto(project.id)
  await expect(members.member(owner.username)).toBeVisible()
  await expect(members.member(contributor.username)).toHaveCount(0)
})

import { randomUUID } from 'node:crypto'
import { test, expect } from './fixtures'
import { createProject, sendInvite } from './helpers/api'
import { uniqueName } from './helpers/uniqueName'
import { DashboardPage } from './pages/DashboardPage'
import { MemberScreen } from './pages/MemberScreen'

test('an invite sent from the members page reaches the invitee', async ({
  page,
  owner,
  contributorPage,
  contributor,
}) => {
  const title = uniqueName('Invite send')
  const project = await createProject(owner, { title, code: 'INVT' })

  const members = new MemberScreen(page)
  await members.goto(project.id)
  await members.sendInvite(contributor.username)

  await expect(members.pendingInvite(contributor.username)).toBeVisible()

  const dashboard = new DashboardPage(contributorPage)
  await dashboard.goto()
  await expect(dashboard.inviteButton('Accept', title)).toBeVisible()
})

test('accepting an invite adds the project under Contributing', async ({
  owner,
  contributorPage,
  contributor,
}) => {
  const title = uniqueName('Invite accept')
  const project = await createProject(owner, { title, code: 'INVT' })
  await sendInvite(owner, project.id, contributor.username)

  const dashboard = new DashboardPage(contributorPage)
  await dashboard.goto()
  await dashboard.inviteButton('Accept', title).click()

  await expect(dashboard.inviteButton('Accept', title)).toHaveCount(0)
  // opening it proves the invitee is now a member, not just that the card moved
  await dashboard.projectLink(dashboard.contributingProjects, title).click()
  await expect(contributorPage).toHaveURL(`/projects/${project.id}`)
  await expect(contributorPage.getByRole('navigation')).toContainText(title)
})

test('a revoked invite is removed for the owner and the invitee', async ({
  page,
  owner,
  contributorPage,
  contributor,
}) => {
  const title = uniqueName('Invite revoke')
  const project = await createProject(owner, { title, code: 'INVT' })
  await sendInvite(owner, project.id, contributor.username)

  const members = new MemberScreen(page)
  await members.goto(project.id)
  const invite = members.pendingInvite(contributor.username)
  await expect(invite).toBeVisible()
  await members.revokeButton(contributor.username).click()
  // the list refetches after a revoke either way, so this is the saved state
  await expect(invite).toHaveCount(0)

  const dashboard = new DashboardPage(contributorPage)
  await dashboard.goto()
  await expect(dashboard.inviteButton('Accept', title)).toHaveCount(0)
})

// RECIPIENT_NOT_FOUND comes back with a field, so this checks the
// API error -> form message path
test('inviting an unknown username shows an error on the field', async ({
  page,
  owner,
}) => {
  const project = await createProject(owner, {
    title: uniqueName('Invite unknown'),
    code: 'INVT',
  })

  const members = new MemberScreen(page)
  await members.goto(project.id)
  await members.sendInvite(`nobody_${randomUUID().slice(0, 8)}`)

  await expect(members.inviteInput).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText(/does not match any user/i)).toBeVisible()
})

import { expect, type Locator, type Page } from '@playwright/test'

export class MemberScreen {
  readonly page: Page
  readonly members: Locator
  readonly inviteInput: Locator
  readonly sendButton: Locator
  readonly pendingInvites: Locator

  constructor(page: Page) {
    this.page = page
    this.members = page.getByRole('region', { name: 'Members' })
    this.inviteInput = page.getByLabel('Invite User')
    this.sendButton = page.getByRole('button', { name: 'Send' })
    this.pendingInvites = page.getByRole('region', { name: 'Pending Invites' })
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/members`)
    await expect(this.members).toBeVisible()
  }

  member(username: string) {
    return this.members.getByRole('listitem').filter({ hasText: username })
  }

  pendingInvite(username: string) {
    return this.pendingInvites.getByText(username, { exact: true })
  }

  revokeButton(username: string) {
    return this.pendingInvites.getByRole('button', {
      name: `Revoke invite for ${username}`,
    })
  }

  async sendInvite(username: string) {
    await this.inviteInput.fill(username)
    await this.sendButton.click()
  }

  async removeMember(username: string) {
    await this.members
      .getByRole('button', { name: `Remove ${username} from project` })
      .click()
    await this.page
      .getByRole('dialog', { name: `Remove ${username} from the project?` })
      .getByRole('button', { name: 'Remove' })
      .click()
  }
}

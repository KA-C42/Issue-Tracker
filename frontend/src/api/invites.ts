import type { Invite } from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'

async function postInvite({
  projectId,
  username,
}: {
  projectId: string
  username: string
}): Promise<Invite> {
  return apiFetch('POST', `/api/projects/${projectId}/invites`, {
    body: { recipient_username: username },
  })
}

export { postInvite }

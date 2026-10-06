import { queryOptions } from '@tanstack/react-query'
import type { Invite, PendingSentInvite } from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'

export const projectInvitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['project-invites', projectId],
    queryFn: ({ signal }) => getProjectInvites(signal, projectId),
  })

async function getProjectInvites(
  abortSignal: AbortSignal,
  projectId: string,
): Promise<PendingSentInvite[]> {
  return apiFetch('GET', `/api/projects/${projectId}/invites`, {
    signal: abortSignal,
  })
}

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

// sender or project creator only
async function revokeInvite(inviteId: string): Promise<Invite> {
  return apiFetch('PATCH', `/api/invites/${inviteId}`, {
    body: { status: 'REVOKED' },
  })
}

export { postInvite, getProjectInvites, revokeInvite }

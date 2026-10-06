import { queryOptions } from '@tanstack/react-query'
import type {
  Invite,
  PendingReceivedInvite,
  PendingSentInvite,
  RecipientResponseFields,
} from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'

export const projectInvitesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['project-invites', projectId],
    queryFn: ({ signal }) => getProjectInvites(signal, projectId),
  })

export const receivedInvitesQueryOptions = queryOptions({
  queryKey: ['received-invites'],
  queryFn: ({ signal }) => getReceivedInvites(signal),
})

async function getProjectInvites(
  abortSignal: AbortSignal,
  projectId: string,
): Promise<PendingSentInvite[]> {
  return apiFetch('GET', `/api/projects/${projectId}/invites`, {
    signal: abortSignal,
  })
}

async function getReceivedInvites(
  abortSignal: AbortSignal,
): Promise<PendingReceivedInvite[]> {
  return apiFetch('GET', `/api/me/invites`, {
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

// recipient only
async function respondToInvite({
  inviteId,
  response,
}: {
  inviteId: string
  response: RecipientResponseFields['status']
}): Promise<Invite> {
  return apiFetch('PATCH', `/api/me/invites/${inviteId}`, {
    body: { status: response },
  })
}

export { postInvite, getProjectInvites, revokeInvite, respondToInvite }

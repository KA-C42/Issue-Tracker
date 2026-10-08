import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi, afterEach } from 'vitest'
import SentInviteCard from '@/components/cards/SentInviteCard'
import * as auth from '@/auth/UseAuth'
import * as invitesApi from '@/api/invites'
import { projectInvitesQueryOptions } from '@/api/invites'

const PROJECT = {
  id: 'p1',
  code: 'ITP',
  creator_id: 'creator',
  title: 'Test project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

const INVITE = {
  id: 'invite-1',
  sender_id: 'sender',
  recipient_id: 'recipient',
  project_id: 'p1',
  status: 'PENDING' as const,
  sent_at: new Date().toISOString(),
  status_changed_at: new Date().toISOString(),
  sender_username: 'sender_name',
  recipient_username: 'recipient_name',
}

const invitesKey = { queryKey: projectInvitesQueryOptions(PROJECT.id).queryKey }

function renderCard(viewerId: string) {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: viewerId },
  } as any)

  const queryClient = new QueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <SentInviteCard {...INVITE} project={PROJECT} />
    </QueryClientProvider>,
  )

  return { invalidate }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows revoke to the project creator', () => {
  renderCard('creator')
  expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument()
})

test('shows revoke to the invite sender', () => {
  renderCard('sender')
  expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument()
})

test('hides revoke from other members', () => {
  renderCard('someone-else')
  expect(
    screen.queryByRole('button', { name: /revoke/i }),
  ).not.toBeInTheDocument()
})

test('revoking sends the invite id and refreshes pending invites', async () => {
  const revoke = vi.spyOn(invitesApi, 'revokeInvite').mockResolvedValue(INVITE)
  const { invalidate } = renderCard('creator')

  fireEvent.click(screen.getByRole('button', { name: /revoke/i }))

  await waitFor(() => expect(invalidate).toHaveBeenCalledWith(invitesKey))
  expect(revoke.mock.calls[0][0]).toBe('invite-1')
})

test('a failed revoke (e.g. 409) still refreshes pending invites', async () => {
  vi.spyOn(invitesApi, 'revokeInvite').mockRejectedValue(new Error('409'))
  const { invalidate } = renderCard('creator')

  fireEvent.click(screen.getByRole('button', { name: /revoke/i }))

  await waitFor(() => expect(invalidate).toHaveBeenCalledWith(invitesKey))
})

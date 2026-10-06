import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi, afterEach } from 'vitest'
import ReceivedInviteCard from '@/components/cards/ReceivedInviteCard'
import * as invitesApi from '@/api/invites'
import { receivedInvitesQueryOptions } from '@/api/invites'
import { projectsQueryOptions } from '@/api/projects'

const INVITE = {
  id: 'invite-1',
  sender_id: 'sender',
  recipient_id: 'recipient',
  project_id: 'p1',
  status: 'PENDING' as const,
  sent_at: new Date().toISOString(),
  status_changed_at: new Date().toISOString(),
  sender_username: 'sender_name',
  project_title: 'Test project',
}

const receivedInvitesKey = { queryKey: receivedInvitesQueryOptions.queryKey }
const projectsKey = { queryKey: projectsQueryOptions.queryKey }

function renderCard() {
  const queryClient = new QueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  render(
    <QueryClientProvider client={queryClient}>
      <ReceivedInviteCard {...INVITE} />
    </QueryClientProvider>,
  )

  return { invalidate }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows the project title and who sent the invite', () => {
  renderCard()

  expect(screen.getByText('Test project')).toBeInTheDocument()
  expect(screen.getByText(/invited by sender_name/i)).toBeInTheDocument()
})

test('accept sends ACCEPTED and refreshes invites and projects', async () => {
  const respond = vi
    .spyOn(invitesApi, 'respondToInvite')
    .mockResolvedValue(INVITE)
  const { invalidate } = renderCard()

  fireEvent.click(screen.getByRole('button', { name: /accept/i }))

  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith(receivedInvitesKey),
  )
  expect(respond.mock.calls[0][0]).toEqual({
    inviteId: 'invite-1',
    response: 'ACCEPTED',
  })
  expect(invalidate).toHaveBeenCalledWith(projectsKey)
})

test('decline sends REJECTED', async () => {
  const respond = vi
    .spyOn(invitesApi, 'respondToInvite')
    .mockResolvedValue(INVITE)
  renderCard()

  fireEvent.click(screen.getByRole('button', { name: /decline/i }))

  await waitFor(() => expect(respond).toHaveBeenCalled())
  expect(respond.mock.calls[0][0]).toEqual({
    inviteId: 'invite-1',
    response: 'REJECTED',
  })
})

test('a failed response (e.g. 409) still refreshes received invites', async () => {
  vi.spyOn(invitesApi, 'respondToInvite').mockRejectedValue(new Error('409'))
  const { invalidate } = renderCard()

  fireEvent.click(screen.getByRole('button', { name: /accept/i }))

  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith(receivedInvitesKey),
  )
})

test('disables both buttons while the response is in flight', async () => {
  // never resolves, so the mutation stays pending
  vi.spyOn(invitesApi, 'respondToInvite').mockReturnValue(
    new Promise<never>(() => {}),
  )
  renderCard()

  fireEvent.click(screen.getByRole('button', { name: /accept/i }))

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled(),
  )
  expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled()
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { InviteForm } from '@/components/InviteForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as invitesApi from '@/api/invites'
import { toast } from 'sonner'
import { ApiError } from '@/api/apiError'

function renderForm() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <InviteForm projectId="p1" />
    </QueryClientProvider>,
  )
}

function submitUsername(username: string) {
  fireEvent.change(screen.getByLabelText(/invite user/i), {
    target: { value: username },
  })
  fireEvent.click(screen.getByRole('button', { name: /send/i }))
}

test('submits successfully with valid username', async () => {
  const postInviteSpy = vi
    .spyOn(invitesApi, 'postInvite')
    .mockResolvedValue({ id: 'invite-1' } as any)

  renderForm()

  fireEvent.change(screen.getByLabelText(/invite user/i), {
    target: { value: 'invitee' },
  })
  fireEvent.click(screen.getByRole('button', { name: /send/i }))

  await waitFor(() => {
    expect(postInviteSpy).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'invitee' }),
      expect.anything(),
    )
  })
})

test('blocks submission and shows an error when username is empty', async () => {
  renderForm()

  const usernameInput = screen.getByLabelText(/invite user/i)
  const sendButton = screen.getByRole('button', { name: /send/i })
  fireEvent.click(sendButton)

  await waitFor(() => {
    expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
  })
})

test('shows a backend field error under the input', async () => {
  vi.spyOn(invitesApi, 'postInvite').mockRejectedValue(
    new ApiError(404, {
      code: 'RECIPIENT_NOT_FOUND',
      message: 'No such user',
      field: 'recipient_username',
    }),
  )

  renderForm()
  submitUsername('nobody_here')

  expect(await screen.findByText('No such user')).toBeInTheDocument()
})

test('shows a toast for errors without a field', async () => {
  vi.spyOn(toast, 'error')
  vi.spyOn(invitesApi, 'postInvite').mockRejectedValue(
    new ApiError(403, { code: 'UNAUTHORIZED_REQUEST', message: 'Not allowed' }),
  )

  renderForm()
  submitUsername('invitee')

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Not allowed')
  })
})

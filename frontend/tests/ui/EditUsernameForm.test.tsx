import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as profilesApi from '@/api/profiles'
import { toast } from 'sonner'
import { ApiError } from '@/api/apiError'
import { EditUsernameForm } from '@/components/EditUsernameForm'

function renderForm() {
  const queryClient = new QueryClient()
  const close = vi.fn()
  const oldName = 'oldName'

  render(
    <QueryClientProvider client={queryClient}>
      <EditUsernameForm username={oldName} close={close} />
    </QueryClientProvider>,
  )

  return { queryClient, close, oldName }
}

function submitUsername(username: string) {
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: username },
  })
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
}

test('starts with the current username filled in', () => {
  const { oldName } = renderForm()

  expect(screen.getByLabelText(/username/i)).toHaveValue(oldName)
})

test('submits a valid username and closes, profile query updates', async () => {
  const newName = 'newName'
  const updatedProfile = {
    id: 'user-1',
    username: newName,
    created_at: '2026-10-01T00:00:00Z',
  }
  const patchSpy = vi
    .spyOn(profilesApi, 'patchUsername')
    .mockResolvedValue(updatedProfile)

  const { queryClient, close } = renderForm()
  submitUsername(newName)

  await waitFor(() => {
    expect(close).toHaveBeenCalled()
  })

  expect(patchSpy).toHaveBeenCalledWith(
    { username: newName },
    expect.objectContaining({ client: queryClient }),
  )
  expect(
    queryClient.getQueryData(profilesApi.profileQueryOptions.queryKey),
  ).toEqual(updatedProfile)
})

test('blocks submission and shows an error when username is invalid', async () => {
  const patchSpy = vi.spyOn(profilesApi, 'patchUsername').mockResolvedValue({})

  renderForm()
  submitUsername('ab')

  expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()
  expect(patchSpy).not.toHaveBeenCalled()
})

test('shows a taken username under the input and stays open', async () => {
  vi.spyOn(profilesApi, 'patchUsername').mockRejectedValue(
    new ApiError(409, {
      code: 'USERNAME_CONFLICT',
      message: 'Requested username is already in use',
      field: 'username',
    }),
  )

  const { close } = renderForm()
  submitUsername('taken_name')

  expect(
    await screen.findByText('Requested username is already in use'),
  ).toBeInTheDocument()
  expect(close).not.toHaveBeenCalled()
})

test('shows a toast for errors without a field', async () => {
  vi.spyOn(toast, 'error')
  vi.spyOn(profilesApi, 'patchUsername').mockRejectedValue(
    new ApiError(404, {
      code: 'USER_NOT_FOUND',
      message: 'Requested user not found',
    }),
  )

  const { close } = renderForm()
  submitUsername('new_name')

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Requested user not found')
  })
  expect(close).not.toHaveBeenCalled()
})

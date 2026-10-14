import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi, afterEach } from 'vitest'
import ProjectDetailsScreen from '@/pages/projectPages/ProjectDetailsScreen'
import * as projectsApi from '@/api/projects'
import { projectsQueryOptions, singleProjectQueryOptions } from '@/api/projects'
import { profileByIdQueryOptions } from '@/api/profiles'
import * as auth from '@/auth/UseAuth'

const PROJECT = {
  id: 'p1',
  code: 'TEST',
  creator_id: 'owner',
  title: 'Test project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

function renderScreen(project: any = PROJECT) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(singleProjectQueryOptions('p1').queryKey, project)
  // <Username> in the card looks up the owner; seed it so nothing hits the network
  queryClient.setQueryData(profileByIdQueryOptions('owner').queryKey, {
    id: 'owner',
    username: 'owner_name',
  })

  const invalidate = vi
    .spyOn(queryClient, 'invalidateQueries')
    .mockResolvedValue(undefined)

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/p1/details']}>
        <Routes>
          <Route
            path="/projects/:id/details"
            element={<ProjectDetailsScreen />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { invalidate }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows Edit to the project creator', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen()

  expect(await screen.findByText(PROJECT.title)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
})

test('hides Edit from a contributor', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'contributor' },
  } as any)

  renderScreen()

  expect(await screen.findByText(PROJECT.title)).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /edit/i }),
  ).not.toBeInTheDocument()
})

test('Edit opens the form filled with the current project', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen()

  fireEvent.click(await screen.findByRole('button', { name: /edit/i }))

  expect(await screen.findByLabelText(/project title/i)).toHaveValue(
    PROJECT.title,
  )
  expect(screen.getByLabelText(/issue code/i)).toHaveValue(PROJECT.code)
  expect(screen.getByLabelText(/description/i)).toHaveValue(PROJECT.description)
})

test('a null description opens as empty instead of crashing', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen({ ...PROJECT, description: null })

  fireEvent.click(await screen.findByRole('button', { name: /edit/i }))

  expect(await screen.findByLabelText(/description/i)).toHaveValue('')
})

test('saving sends the edit and refreshes the project and project list', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)
  const patch = vi
    .spyOn(projectsApi, 'patchProject')
    .mockResolvedValue({ ...PROJECT, title: 'Renamed project' })
  const { invalidate } = renderScreen()

  fireEvent.click(await screen.findByRole('button', { name: /edit/i }))
  const titleInput = await screen.findByLabelText(/project title/i)
  fireEvent.change(titleInput, { target: { value: 'Renamed project' } })
  fireEvent.submit(titleInput.closest('form')!)

  await waitFor(() =>
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: singleProjectQueryOptions('p1').queryKey,
    }),
  )

  expect(patch.mock.calls[0][0]).toEqual({
    id: 'p1',
    body: {
      title: 'Renamed project',
      description: PROJECT.description,
      code: PROJECT.code,
    },
  })
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: projectsQueryOptions.queryKey,
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import IssueDetailScreen from '@/pages/projectPages/IssueDetailScreen'
import { singleIssueQueryOptions } from '@/api/issues'
import { singleProjectQueryOptions } from '@/api/projects'
import { issueCommentsQueryOptions } from '@/api/comments'
import * as auth from '@/auth/UseAuth'

const PROJECT = {
  id: 'p1',
  code: 'ITP',
  creator_id: 'owner',
  title: 'Test project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

const ISSUE = {
  id: 'issue-1',
  code: 1,
  title: 'Test issue',
  details: 'details',
  status: 'BACKLOG',
  creator_id: 'owner',
  project_id: 'p1',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
  status_changed_at: new Date().toISOString(),
}

const COMMENT = {
  id: 'comment-1',
  issue_id: 'issue-1',
  creator_id: 'owner',
  comment: 'a comment from someone else',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(singleIssueQueryOptions('issue-1').queryKey, ISSUE)
  queryClient.setQueryData(singleProjectQueryOptions('p1').queryKey, PROJECT)
  queryClient.setQueryData(issueCommentsQueryOptions('issue-1').queryKey, [
    COMMENT,
  ])

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/p1/issues/issue-1']}>
        <Routes>
          <Route
            path="/projects/:id/issues/:issueId"
            element={<IssueDetailScreen />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('hides Edit and Delete on the issue for a non-creator', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'stranger' },
  } as any)

  renderScreen()

  expect(await screen.findByText('Test issue')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /edit/i }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /delete/i }),
  ).not.toBeInTheDocument()
})

test('hides Edit and Delete on a comment the user does not own', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'stranger' },
  } as any)

  renderScreen()

  expect(await screen.findByText(COMMENT.comment)).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /edit/i }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /delete/i }),
  ).not.toBeInTheDocument()
})

test('shows Edit and Delete on a comment to its own creator', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen()

  expect(
    await screen.findByRole('button', { name: 'Edit comment' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Delete comment' }),
  ).toBeInTheDocument()
})

test('shows Edit and Delete on the issue to its creator', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen()

  expect(await screen.findByText('Test issue')).toBeInTheDocument()

  expect(screen.getByRole('button', { name: 'Edit title' })).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Edit details' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Delete issue' }),
  ).toBeInTheDocument()
})

test('names the edit fields and selects', async () => {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'owner' },
  } as any)

  renderScreen()

  fireEvent.click(await screen.findByRole('button', { name: 'Edit title' }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit details' }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit comment' }))

  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue(
    'Test issue',
  )
  expect(screen.getByRole('textbox', { name: 'Details' })).toHaveValue(
    'details',
  )
  expect(screen.getByRole('textbox', { name: 'Comment' })).toHaveValue(
    COMMENT.comment,
  )
  expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument()
})

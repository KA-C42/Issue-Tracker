import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import { useSortable } from '@dnd-kit/react/sortable'
import { DraggableIssueCard } from '@/components/cards/DraggableIssueCard'
import { singleProjectQueryOptions } from '@/api/projects'
import { profileByIdQueryOptions } from '@/api/profiles'
import * as auth from '@/auth/UseAuth'
import type { Project } from '@issue-tracker/shared'

vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(() => ({ ref: () => {}, handleRef: () => {} })),
}))

const PROJECT: Project = {
  id: 'p1',
  code: 'CODE',
  creator_id: 'owner',
  title: 'Test project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

const ISSUE = {
  id: 'issue-1',
  code: 1,
  title: 'Fix login',
  project_id: 'p1',
  creator_id: 'owner',
  status: 'BACKLOG',
}

function renderCard(assigneeId: string | null) {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: 'member' },
  } as any)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(singleProjectQueryOptions('p1').queryKey, PROJECT)
  queryClient.setQueryData(profileByIdQueryOptions('teammate').queryKey, {
    id: 'teammate',
    username: 'teammate',
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DraggableIssueCard
          issue={{ ...ISSUE, assignee_id: assigneeId } as any}
          index={0}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('a member can drag an unassigned issue', () => {
  renderCard(null)

  expect(
    screen.getByRole('button', { name: 'Drag Fix login' }),
  ).toBeInTheDocument()
  expect(vi.mocked(useSortable).mock.lastCall?.[0].disabled).toBe(false)
})

test("a member can't drag an issue assigned to someone else", () => {
  renderCard('teammate')

  expect(
    screen.queryByRole('button', { name: 'Drag Fix login' }),
  ).not.toBeInTheDocument()
  // with no handle, dnd-kit drags by the whole card, so dragging must be off too
  expect(vi.mocked(useSortable).mock.lastCall?.[0].disabled).toBe(true)
})

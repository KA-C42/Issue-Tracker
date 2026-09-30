import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import MemberScreen from '@/pages/projectPages/MemberScreen'
import { projectContributorsQueryOptions } from '@/api/contributors'
import * as apiFetchModule from '@/api/apiFetch'

const MEMBERS = [
  {
    user_id: 'owner',
    project_id: 'p1',
    username: 'owner_name',
    joined_at: new Date().toISOString(),
  },
  {
    user_id: 'member',
    project_id: 'p1',
    username: 'member_name',
    joined_at: new Date().toISOString(),
  },
]

function renderScreen({ seedMembers = true } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  if (seedMembers) {
    queryClient.setQueryData(
      projectContributorsQueryOptions('p1').queryKey,
      MEMBERS,
    )
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/projects/p1/members']}>
        <Routes>
          <Route path="/projects/:id/members" element={<MemberScreen />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('lists project members by username', async () => {
  renderScreen()

  expect(await screen.findByText('owner_name')).toBeInTheDocument()
  expect(screen.getByText('member_name')).toBeInTheDocument()
})

test('shows an error when members fail to load', async () => {
  vi.spyOn(apiFetchModule, 'apiFetch').mockRejectedValue(new Error('500'))

  renderScreen({ seedMembers: false })

  expect(await screen.findByText("Couldn't load members.")).toBeInTheDocument()
})

import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import MemberCard from '@/components/cards/MemberCard'
import * as auth from '@/auth/UseAuth'

const PROJECT = {
  id: 'p1',
  code: 'ITP',
  creator_id: 'creator',
  title: 'Test project',
  description: 'A test project',
  created_at: new Date().toISOString(),
  modified_at: new Date().toISOString(),
}

const member = (userId: string) => ({
  user_id: userId,
  project_id: 'p1',
  username: `${userId}_name`,
  joined_at: new Date().toISOString(),
})

function renderCard(viewerId: string, memberId: string) {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: viewerId },
  } as any)

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemberCard {...member(memberId)} project={PROJECT} />
    </QueryClientProvider>,
  )
}

test('shows remove to the project creator on other members', () => {
  renderCard('creator', 'member')
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
})

test("hides remove on the creator's own row", () => {
  renderCard('creator', 'creator')
  expect(
    screen.queryByRole('button', { name: /remove/i }),
  ).not.toBeInTheDocument()
})

test('hides remove from non-creators', () => {
  renderCard('member', 'other-member')
  expect(
    screen.queryByRole('button', { name: /remove/i }),
  ).not.toBeInTheDocument()
})

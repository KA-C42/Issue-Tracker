import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import InviteCard from '@/components/cards/InviteCard'
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

function renderCard(viewerId: string) {
  vi.spyOn(auth, 'useAuthProtected').mockReturnValue({
    user: { id: viewerId },
  } as any)

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <InviteCard {...INVITE} project={PROJECT} />
    </QueryClientProvider>,
  )
}

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

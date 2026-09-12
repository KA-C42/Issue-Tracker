import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import * as issuesApi from '@/api/issues'
import { useUpdateIssueStatus } from '@/hooks/useUpdateIssueStatus'

const PROJECT_ID = 'p1'
const ISSUE = { id: 'issue-1', status: 'BACKLOG', title: 'Test issue' }

function setup() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(['project-issues'], [ISSUE])

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { queryClient, wrapper }
}

test('keeps the optimistic update and invalidates on success', async () => {
  vi.spyOn(issuesApi, 'updateIssueStatus').mockResolvedValue({
    id: 'issue-1',
    title: 'Test issue',
    status: 'DONE',
  } as any)

  const { queryClient, wrapper } = setup()
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  const { result } = renderHook(() => useUpdateIssueStatus(PROJECT_ID), {
    wrapper,
  })

  result.current.mutate({ issueId: 'issue-1', newStatus: 'DONE' })

  await waitFor(() => {
    expect(invalidateSpy).toHaveBeenCalled()
  })

  const issues = queryClient.getQueryData<any[]>(['project-issues'])
  expect(issues?.[0].status).toBe('DONE')
})

test('rolls back the optimistic update when the request fails', async () => {
  vi.spyOn(issuesApi, 'updateIssueStatus').mockRejectedValue(new Error('403'))

  const { queryClient, wrapper } = setup()
  const { result } = renderHook(() => useUpdateIssueStatus(PROJECT_ID), {
    wrapper,
  })

  result.current.mutate({ issueId: 'issue-1', newStatus: 'DONE' })

  await waitFor(() => {
    const issues = queryClient.getQueryData<any[]>(['project-issues'])
    expect(issues?.[0].status).toBe('BACKLOG')
  })
})

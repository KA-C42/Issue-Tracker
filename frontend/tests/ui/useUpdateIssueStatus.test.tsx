import { renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { test, expect, vi } from 'vitest'
import * as issuesApi from '@/api/issues'
import { useUpdateIssueStatus } from '@/hooks/useUpdateIssueStatus'
import { ApiError } from '@/api/apiError'
import { Toaster } from 'sonner'

const PROJECT_ID = 'p1'
const ISSUE = { id: 'issue-1', status: 'BACKLOG', title: 'Test issue' }

function setup() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(['project-issues', PROJECT_ID], [ISSUE])

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {children}
    </QueryClientProvider>
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

  const issues = queryClient.getQueryData<any[]>(['project-issues', PROJECT_ID])
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
    const issues = queryClient.getQueryData<any[]>([
      'project-issues',
      PROJECT_ID,
    ])
    expect(issues?.[0].status).toBe('BACKLOG')
  })
})

test("shows the permission message, not the server's, when the update is rejected", async () => {
  const serverMessage =
    'Provided token id is not authorized to make this request'
  vi.spyOn(issuesApi, 'updateIssueStatus').mockRejectedValue(
    new ApiError(403, { code: 'UNAUTHORIZED_REQUEST', message: serverMessage }),
  )

  const { wrapper } = setup()
  const { result } = renderHook(() => useUpdateIssueStatus(PROJECT_ID), {
    wrapper,
  })

  result.current.mutate({ issueId: 'issue-1', newStatus: 'DONE' })

  expect(
    await screen.findByText("You don't have permission to do that."),
  ).toBeInTheDocument()
  expect(screen.queryByText(serverMessage)).not.toBeInTheDocument()
})

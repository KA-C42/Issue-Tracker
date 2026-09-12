import { vi, test, expect } from 'vitest'
import { postIssue } from '@/api/issues'
import * as apiFetchModule from '@/api/apiFetch'

test('converts empty strings to null before posting', async () => {
  const apiFetchSpy = vi.spyOn(apiFetchModule, 'apiFetch').mockResolvedValue({})

  await postIssue({
    project_id: 'p1',
    title: 'Test issue',
    details: '',
    status: 'BACKLOG',
    assignee_id: '',
  })

  expect(apiFetchSpy).toHaveBeenCalledWith(
    'POST',
    '/api/projects/p1/issues',
    expect.objectContaining({
      body: expect.objectContaining({
        details: null,
        assignee_id: null,
      }),
    }),
  )
})

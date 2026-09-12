import type { CreateIssueInput, IssueStatus } from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'
import { queryOptions } from '@tanstack/react-query'

export const projectIssuesQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['project-issues'],
    queryFn: ({ signal }) => getProjectIssues(signal, id),
  })

async function postIssue(data: CreateIssueInput) {
  const result = await apiFetch(
    'POST',
    `/api/projects/${data.project_id}/issues`,
    {
      body: {
        ...data,
        // chose empty string to null conversion here over in schema
        // in schema would require too much type-specification for simple conversion
        details: data.details === '' ? null : data.details,
        assignee_id: data.assignee_id === '' ? null : data.assignee_id,
      },
    },
  )
  return result
}

async function getProjectIssues(abortSignal: AbortSignal, projectId: string) {
  const result = await apiFetch('GET', `/api/projects/${projectId}/issues`, {
    signal: abortSignal,
  })
  return result
}

async function updateIssueStatus({
  issueId,
  newStatus,
}: {
  issueId: string
  newStatus: IssueStatus
}) {
  const result = await apiFetch('PATCH', `/api/issues/${issueId}/status`, {
    body: {
      status: newStatus,
    },
  })

  return result
}

export { postIssue, getProjectIssues, updateIssueStatus }

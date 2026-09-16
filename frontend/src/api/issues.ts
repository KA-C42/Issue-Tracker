import type { CreateIssueInput, IssueStatus } from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'
import { queryOptions } from '@tanstack/react-query'

export const projectIssuesQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['project-issues'],
    queryFn: ({ signal }) => getProjectIssues(signal, id),
  })

export const singleIssueQueryOptions = (issueId: string) =>
  queryOptions({
    queryKey: ['issue', issueId],
    queryFn: ({ signal }) => getIssue(signal, issueId),
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

async function getIssue(abortSignal: AbortSignal, issueId: string) {
  return apiFetch('GET', `/api/issues/${issueId}`, { signal: abortSignal })
}

async function patchIssue({
  issueId,
  data,
}: {
  issueId: string
  data: Partial<
    Pick<CreateIssueInput, 'title' | 'details' | 'status' | 'assignee_id'>
  >
}) {
  return apiFetch('PATCH', `/api/issues/${issueId}`, { body: data })
}

async function deleteIssue(issueId: string) {
  await apiFetch('DELETE', `/api/issues/${issueId}`)
}

export {
  postIssue,
  getProjectIssues,
  updateIssueStatus,
  patchIssue,
  getIssue,
  deleteIssue,
}

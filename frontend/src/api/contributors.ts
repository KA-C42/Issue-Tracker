import { queryOptions } from '@tanstack/react-query'
import type { ProjectMember } from '@issue-tracker/shared'
import { apiFetch } from './apiFetch'

export const projectContributorsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['project-contributors', projectId],
    queryFn: ({ signal }) => getProjectContributors(signal, projectId),
  })

// joined with usernames; ordered by joined_at, so the creator comes first
async function getProjectContributors(
  abortSignal: AbortSignal,
  projectId: string,
): Promise<ProjectMember[]> {
  return apiFetch('GET', `/api/projects/${projectId}/contributors`, {
    signal: abortSignal,
  })
}

// creator only; db trigger unassigns the removed user's issues
async function deleteProjectContributor({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  await apiFetch('DELETE', `/api/projects/${projectId}/contributors/${userId}`)
}

// self-removal; db trigger unassigns the user's issues
async function leaveProject(projectId: string) {
  await apiFetch('DELETE', `/api/me/contributors/${projectId}`)
}

export { getProjectContributors, deleteProjectContributor, leaveProject }

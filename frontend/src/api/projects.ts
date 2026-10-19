import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'
import type {
  ProjectInput,
  Project,
  UpdateProjectInput,
  OwnedProjectSummary,
  ContributingProjectSummary,
} from '@issue-tracker/shared'

export const myProjectsKey = ['me', 'projects'] as const

export const ownedProjectsQueryOptions = queryOptions({
  queryKey: [...myProjectsKey, 'owned'],
  queryFn: ({ signal }) => getOwnedProjects(signal),
})

export const contributingProjectsQueryOptions = queryOptions({
  queryKey: [...myProjectsKey, 'contributing'],
  queryFn: ({ signal }) => getContributingProjects(signal),
})

export const singleProjectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['singleProject', projectId],
    queryFn: ({ signal }) => getSingleProject(signal, projectId),
  })

async function postProject(data: ProjectInput) {
  const result = await apiFetch('POST', '/api/projects', { body: data })
  return result
}

async function getOwnedProjects(
  abortSignal: AbortSignal,
): Promise<OwnedProjectSummary[]> {
  const result = await apiFetch('GET', '/api/me/projects/owned', {
    signal: abortSignal,
  })
  return result
}

async function getContributingProjects(
  abortSignal: AbortSignal,
): Promise<ContributingProjectSummary[]> {
  const result = await apiFetch('GET', '/api/me/projects/contributing', {
    signal: abortSignal,
  })
  return result
}

async function getSingleProject(
  abortSignal: AbortSignal,
  projectId: string,
): Promise<Project> {
  const result = await apiFetch('GET', `/api/projects/${projectId}`, {
    signal: abortSignal,
  })
  return result
}

async function patchProject({
  id,
  body,
}: UpdateProjectInput): Promise<Project> {
  const result = await apiFetch('PATCH', `/api/projects/${id}`, { body })
  return result
}

async function deleteProject(projectId: string) {
  await apiFetch('DELETE', `/api/projects/${projectId}`)
}

export {
  postProject,
  getContributingProjects,
  getOwnedProjects,
  getSingleProject,
  patchProject,
  deleteProject,
}

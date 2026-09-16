import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'
import type { CreateProjectInput, Project } from '@issue-tracker/shared'

export const projectsQueryOptions = queryOptions({
  queryKey: ['projects'],
  queryFn: ({ signal }) => getProjects(signal),
})

export const singleProjectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ['singleProject', projectId],
    queryFn: ({ signal }) => getSingleProject(signal, projectId),
  })

async function postProject(data: CreateProjectInput) {
  const result = await apiFetch('POST', '/api/projects', { body: data })
  return result
}

async function getProjects(abortSignal: AbortSignal): Promise<Project[]> {
  const result = await apiFetch('GET', '/api/me/projects', {
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

export { postProject, getProjects, getSingleProject }

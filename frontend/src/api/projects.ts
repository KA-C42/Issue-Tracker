import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'
import type { projectInputs } from './bodyTypes'

export const projectsQueryOptions = queryOptions({
  queryKey: ['projects'],
  queryFn: ({ signal }) => getProjects(signal),
})

async function postProject(data: projectInputs) {
  const result = await apiFetch('POST', '/api/projects', { body: data })
  return result
}

async function getProjects(abortSignal: AbortSignal) {
  const result = await apiFetch('GET', '/api/projects', { signal: abortSignal })
  return result
}

export { postProject, getProjects }

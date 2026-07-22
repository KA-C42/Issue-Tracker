import { apiFetch } from './apiFetch'
import type { projectInputs } from './bodyTypes'

async function postProject(data: projectInputs) {
  const result = await apiFetch('POST', '/api/projects', { body: data })
  return result
}

export { postProject }

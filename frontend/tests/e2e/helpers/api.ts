import { test } from '@playwright/test'
import type { Project, ProjectInput } from '@issue-tracker/shared'
import type { Account } from '../fixtures'

// Test setup through the backend, so only the behavior under test goes
// through the UI. Same /api path (via the dev server proxy) the app uses.
async function apiPost<T>(
  account: Account,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(new URL(path, test.info().project.use.baseURL), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

export function createProject(
  owner: Account,
  project: Pick<ProjectInput, 'title' | 'code'>,
) {
  return apiPost<Project>(owner, '/api/projects', {
    description: '',
    ...project,
  })
}

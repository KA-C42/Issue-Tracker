import { test } from '@playwright/test'
import type {
  Comment,
  CreateIssueInput,
  Invite,
  Issue,
  Project,
  ProjectInput,
} from '@issue-tracker/shared'
import type { Account } from '../fixtures'

// Test setup through the backend, so only the behavior under test goes
// through the UI. Same /api path (via the dev server proxy) the app uses.
async function apiRequest<T>(
  method: 'POST' | 'PATCH',
  account: Account,
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(new URL(path, test.info().project.use.baseURL), {
    method,
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(
      `${method} ${path} failed: ${res.status} ${await res.text()}`,
    )
  }
  return res.json()
}

const apiPost = <T>(account: Account, path: string, body: unknown) =>
  apiRequest<T>('POST', account, path, body)

const apiPatch = <T>(account: Account, path: string, body: unknown) =>
  apiRequest<T>('PATCH', account, path, body)

export function createProject(
  owner: Account,
  project: Pick<ProjectInput, 'title' | 'code'>,
) {
  return apiPost<Project>(owner, '/api/projects', {
    description: '',
    ...project,
  })
}

export function createIssue(
  author: Account,
  projectId: string,
  issue: Omit<CreateIssueInput, 'project_id'>,
) {
  return apiPost<Issue>(author, `/api/projects/${projectId}/issues`, issue)
}

export function sendInvite(
  sender: Account,
  projectId: string,
  recipientUsername: string,
) {
  return apiPost<Invite>(sender, `/api/projects/${projectId}/invites`, {
    recipient_username: recipientUsername,
  })
}

export function createComment(
  author: Account,
  issueId: string,
  comment: string,
) {
  return apiPost<Comment>(author, `/api/issues/${issueId}/comments`, {
    comment,
  })
}

// invite + accept, so the contributor is a member before the test starts
export async function addContributor(
  owner: Account,
  projectId: string,
  contributor: Account,
) {
  const invite = await sendInvite(owner, projectId, contributor.username)
  await apiPatch<Invite>(contributor, `/api/me/invites/${invite.id}`, {
    status: 'ACCEPTED',
  })
}

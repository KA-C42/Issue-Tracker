import { test, expect } from 'vitest'
import {
  canPatchProject,
  canDeleteProject,
  canRemoveContributor,
  canPatchIssue,
  canDeleteIssue,
  canPatchIssueStatus,
  canPatchIssueAssignee,
  canPatchComment,
  canDeleteComment,
  canRevokeInvite,
} from '@/lib/permissions'

const project = { id: 'p1', creator_id: 'creator' } as any

const issue = {
  id: 'i1',
  creator_id: 'issue-creator',
  project_id: 'p1',
  assignee_id: 'assignee-user',
} as any

const unassignedIssue = {
  id: 'i2',
  creator_id: 'issue-creator',
  project_id: 'p1',
  assignee_id: null,
} as any

const comment = {
  id: 'c1',
  creator_id: 'comment-creator',
  issue_id: 'i1',
} as any

const invite = {
  id: 'inv1',
  sender_id: 'sender-user',
  project_id: 'p1',
} as any

test('canPatchProject allows only the project creator', () => {
  expect(canPatchProject('creator', project)).toBe(true)
  expect(canPatchProject('stranger', project)).toBe(false)
})

test('canDeleteProject allows only the project creator', () => {
  expect(canDeleteProject('creator', project)).toBe(true)
  expect(canDeleteProject('stranger', project)).toBe(false)
})

test('canRemoveContributor allows only the project creator', () => {
  expect(canRemoveContributor('creator', project)).toBe(true)
  expect(canRemoveContributor('stranger', project)).toBe(false)
})

test('canPatchIssue allows the issue creator or project creator, not anyone else', () => {
  expect(canPatchIssue('issue-creator', issue, project)).toBe(true)
  expect(canPatchIssue('creator', issue, project)).toBe(true)
  expect(canPatchIssue('stranger', issue, project)).toBe(false)
})

test('canDeleteIssue allows the issue creator or project creator, not anyone else', () => {
  expect(canDeleteIssue('issue-creator', issue, project)).toBe(true)
  expect(canDeleteIssue('creator', issue, project)).toBe(true)
  expect(canDeleteIssue('stranger', issue, project)).toBe(false)
})

test('canPatchIssueStatus additionally allows the assignee', () => {
  expect(canPatchIssueStatus('issue-creator', issue, project)).toBe(true)
  expect(canPatchIssueStatus('creator', issue, project)).toBe(true)
  expect(canPatchIssueStatus('assignee-user', issue, project)).toBe(true)
  expect(canPatchIssueStatus('stranger', issue, project)).toBe(false)
})

test('canPatchIssueAssignee allows the project creator or issue creator to reassign to anyone', () => {
  expect(canPatchIssueAssignee('creator', issue, project, 'someone-else')).toBe(
    true,
  )
  expect(
    canPatchIssueAssignee('issue-creator', issue, project, 'someone-else'),
  ).toBe(true)
})

test('canPatchIssueAssignee allows the current assignee to remove themselves, not reassign to someone else', () => {
  expect(canPatchIssueAssignee('assignee-user', issue, project, null)).toBe(
    true,
  )
  expect(
    canPatchIssueAssignee('assignee-user', issue, project, 'someone-else'),
  ).toBe(false)
})

test('canPatchIssueAssignee allows anyone to self-claim an unassigned issue, not claim it for someone else', () => {
  expect(
    canPatchIssueAssignee(
      'random-member',
      unassignedIssue,
      project,
      'random-member',
    ),
  ).toBe(true)
  expect(
    canPatchIssueAssignee(
      'random-member',
      unassignedIssue,
      project,
      'someone-else',
    ),
  ).toBe(false)
})

test('canPatchIssueAssignee denies a stranger reassigning an already-assigned issue', () => {
  expect(canPatchIssueAssignee('stranger', issue, project, 'stranger')).toBe(
    false,
  )
})

test('canPatchComment allows only the comment creator', () => {
  expect(canPatchComment('comment-creator', comment)).toBe(true)
  expect(canPatchComment('creator', comment)).toBe(false)
  expect(canPatchComment('stranger', comment)).toBe(false)
})

test('canDeleteComment allows the comment creator or the project creator', () => {
  expect(canDeleteComment('comment-creator', comment, project)).toBe(true)
  expect(canDeleteComment('creator', comment, project)).toBe(true)
  expect(canDeleteComment('stranger', comment, project)).toBe(false)
})

test('canRevokeInvite allows the project creator or the invite sender', () => {
  expect(canRevokeInvite('creator', invite, project)).toBe(true)
  expect(canRevokeInvite('sender-user', invite, project)).toBe(true)
  expect(canRevokeInvite('stranger', invite, project)).toBe(false)
})

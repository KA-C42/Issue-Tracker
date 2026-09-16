import type { Issue, Project, Comment, Invite } from '@issue-tracker/shared'

const isProjectCreator = (userId: string, project: Project) =>
  userId === project.creator_id
const isIssueCreator = (userId: string, issue: Issue) =>
  userId === issue.creator_id
const isCommentCreator = (userId: string, comment: Comment) =>
  userId === comment.creator_id
const isAssignee = (userId: string, issue: Issue) =>
  userId === issue.assignee_id
const isSender = (userId: string, invite: Invite) => userId === invite.sender_id
const isUnassigned = (issue: Issue) => issue.assignee_id === null

export const canPatchProject = isProjectCreator
export const canDeleteProject = isProjectCreator
export const canRemoveContributor = isProjectCreator

export const canPatchIssue = (userId: string, issue: Issue, project: Project) =>
  isProjectCreator(userId, project) || isIssueCreator(userId, issue)
export const canDeleteIssue = canPatchIssue
export const canPatchIssueStatus = (
  userId: string,
  issue: Issue,
  project: Project,
) => canPatchIssue(userId, issue, project) || isAssignee(userId, issue)

export const canPatchIssueAssignee = (
  userId: string,
  issue: Issue,
  project: Project,
  newAssigneeId: string | null,
) =>
  canPatchIssue(userId, issue, project) ||
  (isAssignee(userId, issue) && newAssigneeId === null) ||
  (isUnassigned(issue) && newAssigneeId === userId)

export const canPatchComment = isCommentCreator
export const canDeleteComment = (
  userId: string,
  comment: Comment,
  project: Project,
) => isCommentCreator(userId, comment) || isProjectCreator(userId, project)

export const canRevokeInvite = (
  userId: string,
  invite: Invite,
  project: Project,
) => isProjectCreator(userId, project) || isSender(userId, invite)

import { getIssue } from '../../db/services/issueServies.js'
import {
  getProject,
  isProjectMember,
} from '../../db/services/project.services.js'
import { getProfile } from '../../db/services/userServices.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import type { IssueStatus } from '../../types/enums.js'
import { AppError } from '../errors/AppError.js'
import type { issuePostFields } from '../queries/issueQueryBuilders.js'

async function validateIssuePost(
  user: JwtUser,
  body: issuePostFields,
  id: string,
) {
  if (!body.title) throw new AppError('MISSING_ISSUE_TITLE')

  const project = await getProject(id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  const creator = await getProfile(user.sub)
  if (!creator) throw new AppError('CREATOR_NOT_FOUND')

  const isMember = await isProjectMember(id, creator.id)
  if (!isMember) throw new AppError('UNAUTHORIZED_REQUEST')

  if (body.assignee_id) {
    const assignee = await getProfile(body.assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')

    const isMember = await isProjectMember(id, body.assignee_id)
    if (!isMember) throw new AppError('INVALID_ASSIGNEE')
  }
}

async function validateIssueGet(
  project_id: string | undefined,
  user: JwtUser,
  assignee_id: string | undefined,
) {
  let unauthorized

  if (project_id) {
    const project = await getProject(project_id)
    if (!project) throw new AppError('PROJECT_NOT_FOUND')
    if (!(await isProjectMember(project_id, user.sub))) unauthorized = true
  }
  if (assignee_id) {
    const assignee = await getProfile(assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')

    if (!project_id) {
      if (user.sub !== assignee_id) unauthorized = true
    } else {
      if (!(await isProjectMember(project_id, user.sub))) unauthorized = true
    }
  }
  if (!project_id && !assignee_id)
    throw new AppError('MISSING_SEARCH_PARAMETER')

  if (unauthorized) throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateIssuePatch(
  id: string,
  title: string | undefined,
  details: string | undefined,
  status: IssueStatus | undefined,
  assignee_id: string | undefined,
  user: JwtUser,
) {
  const issue = await getIssue(id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const project = await getProject(issue.project_id)

  const isCreatorOrOwner =
    user.sub === issue.creator_id || user.sub === project.owner_id
  const isAssignee = user.sub === issue.assignee_id

  // ensure >= 1 field to update
  const update =
    !!(assignee_id || title || details || status) || assignee_id === null

  if (!update) throw new AppError('MISSING_ISSUE_PATCH_FIELDS')

  if (assignee_id) {
    const isMember = await isProjectMember(project.id, assignee_id)
    if (!isMember) {
      const exists = await getProfile(assignee_id)
      if (!exists) throw new AppError('ASSIGNEE_NOT_FOUND')
      else throw new AppError('INVALID_ASSIGNEE')
    }
  }

  if ((title || details || assignee_id !== undefined) && !isCreatorOrOwner)
    throw new AppError('UNAUTHORIZED_REQUEST')

  if (status && !isCreatorOrOwner && !isAssignee)
    throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateIssueDelete(user: JwtUser, id: string) {
  const issue = await getIssue(id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const project = await getProject(issue.project_id)

  if (user.sub !== issue.creator_id && user.sub !== project.owner_id)
    throw new AppError('UNAUTHORIZED_REQUEST')
}

export {
  validateIssuePost,
  validateIssueGet,
  validateIssuePatch,
  validateIssueDelete,
}

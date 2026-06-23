import { getIssue } from '../../db/services/issueServices.js'
import {
  getProject,
  isProjectMember,
} from '../../db/services/project.services.js'
import { getProfile } from '../../db/services/userServices.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'
import type {
  issuePatchFields,
  issuePostFields,
} from '../queries/issueQueryBuilders.js'

async function validateIssuePost(
  user: JwtUser,
  body: issuePostFields,
  projectId: string | undefined,
) {
  if (!body.title) throw new AppError('MISSING_ISSUE_TITLE')
  if (!projectId) throw new AppError('MISSING_PROJECT_ID')

  const project = await getProject(projectId)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  const isMember = await isProjectMember(projectId, user.sub)
  if (!isMember) throw new AppError('UNAUTHORIZED_REQUEST')

  if (body.assignee_id) {
    const assignee = await getProfile(body.assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')

    const isMember = await isProjectMember(projectId, body.assignee_id)
    if (!isMember) throw new AppError('INVALID_ASSIGNEE')
  }
}

async function validateIssueGet(
  user: JwtUser,
  project_id: string | undefined,
  assignee_id: string | undefined,
) {
  if (project_id) {
    const project = await getProject(project_id)
    if (!project) throw new AppError('PROJECT_NOT_FOUND')
    if (!(await isProjectMember(project_id, user.sub)))
      throw new AppError('UNAUTHORIZED_REQUEST')
  }
  if (assignee_id) {
    const assignee = await getProfile(assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')

    if (!project_id) {
      if (user.sub !== assignee_id) throw new AppError('UNAUTHORIZED_REQUEST')
    } else {
      if (!(await isProjectMember(project_id, user.sub)))
        throw new AppError('UNAUTHORIZED_REQUEST')
    }
  }
}

async function validateIssuePatch(
  user: JwtUser,
  id: string | undefined,
  body: issuePatchFields,
) {
  if (!id) throw new AppError('MISSING_ISSUE_ID')
  const issue = await getIssue(id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const project = await getProject(issue.project_id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  const isCreatorOrOwner =
    user.sub === issue.creator_id || user.sub === project.owner_id
  const isAssignee = user.sub === issue.assignee_id

  // ensure >= 1 field to update, including a null assignee
  const update =
    !!(body.assignee_id || body.title || body.details || body.status) ||
    body.assignee_id === null

  if (!update) throw new AppError('MISSING_ISSUE_PATCH_FIELDS')

  if (body.assignee_id) {
    const isMember = await isProjectMember(project.id, body.assignee_id)
    if (!isMember) {
      const exists = await getProfile(body.assignee_id)
      if (!exists) throw new AppError('ASSIGNEE_NOT_FOUND')
      else throw new AppError('INVALID_ASSIGNEE')
    }
  }

  if (
    (body.title || body.details || body.assignee_id !== undefined) &&
    !isCreatorOrOwner
  )
    throw new AppError('UNAUTHORIZED_REQUEST')

  if (body.status && !isCreatorOrOwner && !isAssignee)
    throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateIssueDelete(user: JwtUser, id: string | undefined) {
  if (!id) throw new AppError('MISSING_ISSUE_ID')

  const issue = await getIssue(id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const project = await getProject(issue.project_id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  if (user.sub !== issue.creator_id && user.sub !== project.owner_id)
    throw new AppError('UNAUTHORIZED_REQUEST')
}

export {
  validateIssuePost,
  validateIssueGet,
  validateIssuePatch,
  validateIssueDelete,
}

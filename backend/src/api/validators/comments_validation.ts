import { getComment } from '../../db/services/commentServices.js'
import { getIssue } from '../../db/services/issueServies.js'
import { isProjectMember } from '../../db/services/project.services.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

async function validateCommentPost(
  user: JwtUser,
  issue_id: string | undefined,
  comment: string | undefined,
) {
  if (!comment) throw new AppError('MISSING_COMMENT_TEXT')
  if (!issue_id) throw new AppError('MISSING_ISSUE_ID')

  const issue = await getIssue(issue_id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const isMember = await isProjectMember(issue.project_id, user.sub)
  if (!isMember) throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateCommentGet(user: JwtUser, issue_id: string | undefined) {
  if (!issue_id) throw new AppError('MISSING_ISSUE_ID')

  const issue = await getIssue(issue_id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const isMember = await isProjectMember(issue.project_id, user.sub)
  if (!isMember) throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateCommentPatch(
  user: JwtUser,
  id: string | undefined,
  newComment: string | undefined,
) {
  if (!newComment) throw new AppError('MISSING_COMMENT_TEXT')
  if (!id) throw new AppError('MISSING_COMMENT_ID')

  const comment = await getComment(id)
  if (!comment) throw new AppError('COMMENT_NOT_FOUND')
  if (user.sub !== comment.author_id) throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateCommentDelete(user: JwtUser, id: string | undefined) {
  if (!id) throw new AppError('MISSING_COMMENT_ID')

  const comment = await getComment(id)
  if (!comment) throw new AppError('COMMENT_NOT_FOUND')
  if (user.sub !== comment.author_id) throw new AppError('UNAUTHORIZED_REQUEST')
}

export {
  validateCommentPost,
  validateCommentGet,
  validateCommentPatch,
  validateCommentDelete,
}

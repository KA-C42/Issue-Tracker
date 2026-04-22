import { getComment } from '../../db/services/commentServices.js'
import { getContributor } from '../../db/services/contributorServices.js'
import { getIssue } from '../../db/services/issueServies.js'
import { getProject } from '../../db/services/project.services.js'
import { getUser } from '../../db/services/userServices.js'
import { AppError } from '../errors/AppError.js'

async function validateCommentPost(
  author_id: string,
  issue_id: string,
  comment: string,
) {
  if (!comment) throw new AppError('MISSING_COMMENT_TEXT')

  let user
  let issue

  if (author_id) {
    user = await getUser(author_id)
    if (!user) throw new AppError('AUTHOR_NOT_FOUND')
  } else throw new AppError('MISSING_AUTHOR_ID')

  if (issue_id) {
    issue = await getIssue(issue_id)
    if (!issue) throw new AppError('ISSUE_NOT_FOUND')
  } else throw new AppError('MISSING_ISSUE_ID')

  const project = await getProject(issue.project_id)
  if (author_id !== project.owner_id) {
    const contributor = await getContributor(issue.project_id, author_id)
    if (!contributor) throw new AppError('INVALID_AUTHOR')
  }
}

async function validateCommentPatch(
  id: string,
  author_id: string,
  comment: string,
) {
  if (!comment) throw new AppError('MISSING_COMMENT_TEXT')
  if (!author_id) throw new AppError('MISSING_AUTHOR_ID')
  else {
    const comment = await getComment(id)
    if (!comment) throw new AppError('COMMENT_NOT_FOUND')
    if (author_id !== comment.author_id)
      throw new AppError('NOT_COMMENT_AUTHOR')
  }
}

export { validateCommentPost, validateCommentPatch }

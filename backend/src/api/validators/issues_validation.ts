import { getContributor } from '../../db/services/contributorServices.js'
import { getProject } from '../../db/services/project.services.js'
import { getUser } from '../../db/services/userServices.js'
import { AppError } from '../errors/AppError.js'
import type { issuePostFields } from '../queries/issueQueryBuilders.js'

async function validateIssuePost(body: issuePostFields) {
  if (!body.creator_id) throw new AppError('MISSING_CREATOR_ID')
  if (!body.title) throw new AppError('MISSING_ISSUE_TITLE')

  const project = await getProject(body.project_id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  const creator = await getUser(body.creator_id)
  if (!creator) throw new AppError('CREATOR_NOT_FOUND')

  if (creator.id !== project.owner_id) {
    const contributor = await getContributor(project.id, creator.id)
    if (!contributor) throw new AppError('INVALID_CREATOR')
  }

  if (body.assignee_id) {
    const assignee = await getUser(body.assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')

    if (assignee.id !== project.owner_id) {
      const contributor = await getContributor(project.id, assignee.id)
      if (!contributor) throw new AppError('INVALID_ASSIGNEE')
    }
  }
}

export { validateIssuePost }

import { getContributor } from '../../db/services/contributorServices.js'
import { getIssue } from '../../db/services/issueServies.js'
import { getProject } from '../../db/services/project.services.js'
import { getUser } from '../../db/services/userServices.js'
import type { IssueStatus } from '../../db/types/enums.js'
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

async function validateIssueGet(
  project_id: string | undefined,
  assignee_id: string | undefined,
  issue_id: string | undefined,
) {
  if (project_id) {
    const project = await getProject(project_id)
    if (!project) throw new AppError('PROJECT_NOT_FOUND')
  }
  if (assignee_id) {
    const assignee = await getUser(assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')
  }
  if (!project_id && !assignee_id && !issue_id)
    throw new AppError('MISSING_SEARCH_PARAMETER')
}

async function validateIssuePatch(
  id: string,
  title: string | undefined,
  details: string | undefined,
  status: IssueStatus | undefined,
  assignee_id: string | undefined,
) {
  const issue = await getIssue(id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const project = await getProject(issue.project_id)

  // ensure >= field to update
  let update = false

  if (assignee_id && assignee_id != project.owner_id) {
    const assignee = await getUser(assignee_id)
    if (!assignee) throw new AppError('ASSIGNEE_NOT_FOUND')
    update = true

    const contributor = await getContributor(project.id, assignee_id)
    if (!contributor) throw new AppError('INVALID_ASSIGNEE')
  } else if (assignee_id === null) update = true

  if (title || details || status) update = true

  if (!update) throw new AppError('MISSING_ISSUE_PATCH_FIELDS')
}

export { validateIssuePost, validateIssueGet, validateIssuePatch }

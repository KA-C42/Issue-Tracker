import {
  isProjectMember,
  isProjectOwner,
} from '../../db/services/project.services.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

// prettier-ignore
async function validateContributorsGet(user: JwtUser, id: string | undefined, type: 'project' | 'user') {
  if (!id) throw new AppError('MISSING_CONTRIBUTOR_ID')
  if (type === 'user' && user.sub !== id) throw new AppError('UNAUTHORIZED_REQUEST')
  if (type === 'project' && !(await isProjectMember(id, user.sub))) throw new AppError('UNAUTHORIZED_REQUEST')
  return id
}

async function validateContributorsDelete(
  user: JwtUser,
  projectId: string | undefined,
  userId: string | undefined,
  parent: 'project' | 'user',
) {
  if (!projectId) throw new AppError('MISSING_PROJECT_ID')
  if (!userId) throw new AppError('MISSING_USER_ID')

  if (
    !user ||
    (parent === 'user' && user.sub !== userId) ||
    (parent === 'project' && !(await isProjectOwner(projectId, user.sub)))
  ) {
    throw new AppError('UNAUTHORIZED_REQUEST')
  }
}

export { validateContributorsGet, validateContributorsDelete }

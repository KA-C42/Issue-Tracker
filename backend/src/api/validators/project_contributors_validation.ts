import {
  isProjectMember,
  isProjectOwner,
} from '../../db/services/project.services.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

type ContributorsReq = {
  user_id?: string
  project_id?: string
}

// prettier-ignore
async function validateContributorsGet(user: JwtUser | undefined, id: string, type: 'project' | 'user') {
  if (!user) throw new AppError('UNAUTHORIZED_REQUEST')
  if (type === 'user' && user.sub !== id) throw new AppError('UNAUTHORIZED_REQUEST')
  if (type === 'project' && !(await isProjectMember(id, user.sub))) throw new AppError('UNAUTHORIZED_REQUEST')
  return id
}

function validateContributorsPost(req: ContributorsReq) {
  if (!req.user_id) {
    throw new AppError('MISSING_USER_ID')
  }

  if (!req.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
}

async function validateContributorsDelete(
  user: JwtUser | undefined,
  projectId: string,
  userId: string,
  parent: 'project' | 'user',
) {
  if (
    !user ||
    (parent === 'user' && user.sub !== userId) ||
    (parent === 'project' && !(await isProjectOwner(projectId, user.sub)))
  ) {
    throw new AppError('UNAUTHORIZED_REQUEST')
  }
}

export {
  validateContributorsGet,
  validateContributorsPost,
  validateContributorsDelete,
}

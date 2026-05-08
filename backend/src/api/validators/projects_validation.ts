import {
  getProject,
  isProjectMember,
} from '../../db/services/project.services.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

type CreateProjectBody = {
  name: string
  code: string
}

type PatchProjectBody = {
  name?: string
  code?: string
  description?: string
}

async function validateProjectGet(
  user: JwtUser,
  projectId: string | undefined,
) {
  if (!projectId) throw new AppError('MISSING_PROJECT_ID')

  if (!(await isProjectMember(projectId, user.sub)))
    throw new AppError('UNAUTHORIZED_REQUEST')
}

// prettier-ignore
function validateProjectPost(body: CreateProjectBody) {
  if (!body.name) throw new AppError('MISSING_PROJECT_NAME')
  if (!body.code) throw new AppError('MISSING_PROJECT_CODE')
}

async function validateProjectPatch(
  user: JwtUser,
  id: string | undefined,
  body: PatchProjectBody,
) {
  if (!id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
  if (!body.name && !body.code && !body.description)
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')

  const project = await getProject(id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  if (user.sub !== project.owner_id) throw new AppError('UNAUTHORIZED_REQUEST')
}

async function validateProjectDelete(user: JwtUser, id: string | undefined) {
  if (!id) throw new AppError('MISSING_PROJECT_ID')

  const project = await getProject(id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

  if (user.sub !== project.owner_id) throw new AppError('UNAUTHORIZED_REQUEST')
}
export {
  validateProjectGet,
  validateProjectPost,
  validateProjectPatch,
  validateProjectDelete,
}

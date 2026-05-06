import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

type CreateProjectBody = {
  owner_id: string
  name: string
  code: string
}

type PatchProjectBody = {
  name?: string
  code?: string
  description?: string
}

// prettier-ignore
function validateProjectGet(projectId: string | undefined, user: JwtUser | undefined) {
    if (!user) throw new AppError('UNAUTHORIZED_REQUEST')
    if (!projectId) throw new AppError('MISSING_PROJECT_ID')

  return { projectId, user }
}

// prettier-ignore
function validateProjectPost(body: CreateProjectBody) {
  if (!body.name) throw new AppError('MISSING_PROJECT_NAME')
  if (!body.code) throw new AppError('MISSING_PROJECT_CODE')
}

function validateProjectPatch(
  id: string | undefined,
  body: PatchProjectBody,
  user: JwtUser | undefined,
) {
  if (!id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
  if (!body) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }
  if (!user) {
    throw new AppError('UNAUTHORIZED_REQUEST')
  }

  return { id, user }
}

function validateProjectDelete(
  id: string | undefined,
  user: JwtUser | undefined,
) {
  if (!id) throw new AppError('MISSING_PROJECT_ID')
  if (!user) throw new AppError('UNAUTHORIZED_REQUEST')

  return { id, user }
}
export {
  validateProjectGet,
  validateProjectPost,
  validateProjectPatch,
  validateProjectDelete,
}

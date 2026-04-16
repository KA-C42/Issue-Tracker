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

function validateProjectPost(req: CreateProjectBody) {
  if (!req.owner_id) {
    throw new AppError('MISSING_OWNER_ID')
  }

  if (!req.name) {
    throw new AppError('MISSING_PROJECT_NAME')
  }

  if (!req.code) {
    throw new AppError('MISSING_PROJECT_CODE')
  }
}

function validateProjectPatch(req: PatchProjectBody) {
  if (!req) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }
}

export { validateProjectPost, validateProjectPatch }

import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'

function validateProjectPost(req: Request) {
  if (!req.body.owner_id) {
    throw new AppError('MISSING_OWNER_ID')
  }

  if (!req.body.name) {
    throw new AppError('MISSING_PROJECT_NAME')
  }

  if (!req.body.code) {
    throw new AppError('MISSING_PROJECT_CODE')
  }
}

function validateProjectPatch(req: Request) {
  if (!req.body) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }
}

export { validateProjectPost, validateProjectPatch }

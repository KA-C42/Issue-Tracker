import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'

function validateContributorsPost(req: Request) {
  if (!req.body.user_id) {
    throw new AppError('MISSING_USER_ID')
  }

  if (!req.body.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
}

function validateContributorsDelete(req: Request) {
  if (!req.query.project_id && !req.query.user_id) {
    throw new AppError('MISSING_QUERY')
  }
  if (!req.query.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
  if (!req.query.user_id) {
    throw new AppError('MISSING_USER_ID')
  }
}

export { validateContributorsPost, validateContributorsDelete }

import { AppError } from '../errors/AppError.js'

type ContributorsReq = {
  user_id?: string
  project_id?: string
}

function validateContributorsPost(req: ContributorsReq) {
  if (!req.user_id) {
    throw new AppError('MISSING_USER_ID')
  }

  if (!req.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
}

function validateContributorsDelete(req: ContributorsReq) {
  if (!req.project_id && !req.user_id) {
    throw new AppError('MISSING_QUERY')
  }
  if (!req.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
  if (!req.user_id) {
    throw new AppError('MISSING_USER_ID')
  }
}

export { validateContributorsPost, validateContributorsDelete }

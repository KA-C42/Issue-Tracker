import { AppError } from './AppError.js'
import type { DbError } from './DbError.js'

export default function dbErrorMapper(err: DbError): never {
  if (err.code === '23514') {
    if (err.constraint === 'projects_code_check') {
      throw new AppError('INVALID_CODE')
    }
  } else if (err.code === '23505') {
    if (err.constraint === 'projects_owner_id_name_key') {
      throw new AppError('PROJECT_NAME_CONFLICT')
    } else if (err.constraint === 'users_username_key') {
      throw new AppError('USERNAME_CONFLICT')
    } else if (err.constraint === 'project_contributors_pkey') {
      throw new AppError('ALREADY_MADE_CONTRIBUTOR')
    }
  } else if (err.code === '23503') {
    if (err.constraint === 'project_contributors_user_id_fkey') {
      throw new AppError('USER_NOT_FOUND')
    }
    if (err.constraint === 'project_contributors_project_id_fkey') {
      throw new AppError('PROJECT_NOT_FOUND')
    }
  }

  throw err
}

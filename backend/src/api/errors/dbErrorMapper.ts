import { AppError } from './AppError.js'
import type { DbError } from './DbError.js'

// prettier-ignore
export default function dbErrorMapper(err: DbError): never {
  if (err.code === '23514') {
    if (err.constraint === 'projects_code_check') throw new AppError('INVALID_CODE')
  } 
  
  else if (err.code === '23505') {
    if (err.constraint === 'projects_owner_id_name_key') throw new AppError('PROJECT_NAME_CONFLICT')
    else if (err.constraint === 'users_username_key') throw new AppError('USERNAME_CONFLICT')
    else if (err.constraint === 'project_contributors_pkey') throw new AppError('ALREADY_MADE_CONTRIBUTOR')
    else if (err.constraint === 'issues_project_id_title_key') throw new AppError('ISSUE_TITLE_CONFLICT')
    else if (err.constraint === 'one_pending_invite_per_project') throw new AppError('INVITE_ALREADY_PENDING')
  } 
  
  else if (err.code === '23503') {
    if (err.constraint === 'project_contributors_user_id_fkey') throw new AppError('USER_NOT_FOUND')
    else if (err.constraint === 'project_contributors_project_id_fkey') throw new AppError('PROJECT_NOT_FOUND')
  } 
  
  else if (err.code === '23502') {
    if (err.column === 'title') throw new AppError('MISSING_ISSUE_TITLE')
  }

  else if (err.code === 'P0001') {
    if ( err.message === 'RECIPIENT_OWNS_PROJECT' ) throw new AppError('RECIPIENT_OWNS_PROJECT')
    else if ( err.message === 'RECIPIENT_ALREADY_CONTRIBUTOR' ) throw new AppError('RECIPIENT_ALREADY_CONTRIBUTOR')
  }

  throw err
}

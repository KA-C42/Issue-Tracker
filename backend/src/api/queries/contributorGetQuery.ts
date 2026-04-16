import { AppError } from '../errors/AppError.js'

type ContributorGetQuery = {
  user_id?: string
  project_id?: string
}

export function buildContributorGetQuery(query: ContributorGetQuery) {
  if (query.user_id) {
    return {
      text: `
        SELECT 
          users.username,
          project_contributors.user_id, 
          project_contributors.project_id, 
          project_contributors.joined_at
        FROM users
        LEFT JOIN project_contributors 
          ON users.id = project_contributors.user_id
        WHERE users.id = $1
        ORDER BY project_contributors.joined_at
      `,
      values: [query.user_id],
      notFoundError: 'USER_NOT_FOUND',
    }
  }

  if (query.project_id) {
    return {
      text: `
        SELECT 
          projects.name,
          project_contributors.user_id, 
          project_contributors.project_id, 
          project_contributors.joined_at
        FROM projects
        LEFT JOIN project_contributors 
          ON projects.id = project_contributors.project_id
        WHERE projects.id = $1
        ORDER BY project_contributors.joined_at
      `,
      values: [query.project_id],
      notFoundError: 'PROJECT_NOT_FOUND',
    }
  }

  throw new AppError('MISSING_QUERYABLE_ID')
}

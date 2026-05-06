import { AppError } from '../../api/errors/AppError.js'
import type { DbError } from '../../api/errors/DbError.js'
import dbErrorMapper from '../../api/errors/dbErrorMapper.js'
import type { Project } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getProject(projectId: string): Promise<Project> {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
    projectId,
  ])

  return (result.rows[0] as Project) ?? null
}

export async function isProjectMember(
  projectId: string,
  userId: string,
): Promise<boolean> {
  const text = `SELECT * FROM projects
      WHERE id = $1
      AND (
        owner_id = $2
        OR EXISTS ( 
          SELECT 1 FROM project_contributors
          WHERE project_id = $1 AND user_id = $2
        )
      )`
  const values = [projectId, userId]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      if (!(await getProject(projectId))) {
        throw new AppError('PROJECT_NOT_FOUND')
      }
      return false
    }
    return true
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
}

export async function isProjectOwner(projectId: string, userId: string) {
  const text = 'SELECT * FROM projects WHERE id = $1 and owner_id = $2'
  const values = [projectId, userId]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('UNAUTHORIZED_REQUEST')
    }
    return true
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
}

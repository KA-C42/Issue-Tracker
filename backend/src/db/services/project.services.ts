import type { Project } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getProject(projectId: string): Promise<Project> {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
    projectId,
  ])

  return (result.rows[0] as Project) ?? null
}

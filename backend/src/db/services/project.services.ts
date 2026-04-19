import { pool } from '../pool.js'

export async function getProject(projectId: string) {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
    projectId,
  ])

  return result.rows[0] ?? null
}

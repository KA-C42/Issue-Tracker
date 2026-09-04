import type { ProjectContributor } from '@issue-tracker/shared'
import { pool } from '../pool.js'

export async function getContributor(
  project_id: string,
  user_id: string,
): Promise<ProjectContributor | null> {
  const text = `
    SELECT * FROM project_contributors
    WHERE project_id = $1 AND user_id = $2
  `
  const values = [project_id, user_id]

  const result = await pool.query(text, values)
  return (result.rows[0] as ProjectContributor) ?? null
}

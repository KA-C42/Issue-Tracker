import type { ProjectContributor } from '../types/db.js'
import { pool } from '../pool.js'

export async function getContributor(
  projectId: string,
  userId: string,
): Promise<ProjectContributor> {
  //   try {
  const result = await pool.query(
    'SELECT * FROM project_contributors WHERE (project_id, user_id) = ($1, $2)',
    [projectId, userId],
  )
  return (result.rows[0] as ProjectContributor) ?? null
}

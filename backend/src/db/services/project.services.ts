import type { Project } from '@issue-tracker/shared'
import { pool } from '../pool.js'
import { getContributor } from './contributorServices.js'

export async function getProject(projectId: string): Promise<Project | null> {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
    projectId,
  ])

  return (result.rows[0] as Project) ?? null
}

export async function checkMembership(
  user_id: string,
  project_id: string,
): Promise<boolean> {
  return (await getContributor(project_id, user_id)) !== null
}

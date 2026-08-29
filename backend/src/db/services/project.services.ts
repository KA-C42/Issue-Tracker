import type { Project, ProjectContributor } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getProject(projectId: string): Promise<Project | null> {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [
    projectId,
  ])

  return (result.rows[0] as Project) ?? null
}

export async function getContributor(
  project_id: string,
  user_id: string,
): Promise<ProjectContributor | null> {
  const text = `
    SELECT 1 FROM project_contributors
    WHERE project_id = $1 AND user_id = $2
  `
  const values = [project_id, user_id]

  const result = await pool.query(text, values)
  return (result.rows[0] as ProjectContributor) ?? null
}

export async function checkMembership(
  user_id: string,
  project: Project,
): Promise<boolean> {
  if (user_id === project.creator_id) return true
  return (await getContributor(project.id, user_id)) !== null
}

import type { Issue } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getIssue(issue_id: string): Promise<Issue> {
  const result = await pool.query('SELECT * FROM issues WHERE id = $1', [
    issue_id,
  ])

  return (result.rows[0] as Issue) ?? null
}

import type { Issue } from '@issue-tracker/shared'
import { pool } from '../pool.js'

export async function getIssue(issue_id: string): Promise<Issue | null> {
  const result = await pool.query('SELECT * FROM issues WHERE id = $1', [
    issue_id,
  ])

  return (result.rows[0] as Issue) ?? null
}

import { pool } from '../pool.js'

export async function getIssue(issue_id: string) {
  const result = await pool.query('SELECT * FROM issues WHERE id = $1', [
    issue_id,
  ])

  return result.rows[0] ?? null
}

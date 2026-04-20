import { pool } from '../pool.js'

export async function getUser(userId: string) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])

  return result.rows[0] ?? null
}

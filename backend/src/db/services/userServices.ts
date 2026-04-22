import type { User } from '../types/db.js'
import { pool } from '../pool.js'

export async function getUser(userId: string): Promise<User> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])

  return (result.rows[0] as User) ?? null
}

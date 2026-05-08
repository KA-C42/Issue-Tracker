import type { Profile } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [
    userId,
  ])

  return (result.rows[0] as Profile) ?? null
}

import type { Invite } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getInvite(id: string): Promise<Invite | null> {
  const result = await pool.query('SELECT * FROM invites WHERE id = $1', [id])

  return (result.rows[0] as Invite) ?? null
}

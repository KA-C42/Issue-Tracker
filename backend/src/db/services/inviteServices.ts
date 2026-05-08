import type { Invitation } from '../../types/db.js'
import { pool } from '../pool.js'

export async function getInvitation(id: string): Promise<Invitation | null> {
  const result = await pool.query('SELECT * FROM invitations WHERE id = $1', [
    id,
  ])

  return (result.rows[0] as Invitation) ?? null
}

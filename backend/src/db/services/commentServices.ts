import { pool } from '../pool.js'

export async function getComment(commentId: string) {
  const result = await pool.query('SELECT * FROM comments WHERE id = $1', [
    commentId,
  ])

  return result.rows[0] ?? null
}

import type { Comment } from '@issue-tracker/shared'
import { pool } from '../pool.js'

export async function getComment(commentId: string): Promise<Comment | null> {
  const result = await pool.query('SELECT * FROM comments WHERE id = $1', [
    commentId,
  ])

  return (result.rows[0] as Comment) ?? null
}

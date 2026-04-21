import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { validateCommentPost } from '../validators/comments_validation.js'

const commentRouter = Router({ mergeParams: true })

// Create new comment
commentRouter.post<{ issue_id: string }>('/', async (req, res) => {
  await validateCommentPost(
    req.body.author_id,
    req.params.issue_id,
    req.body.comment,
  )

  const text =
    'INSERT INTO comments (author_id, issue_id, comment) VALUES ($1, $2, $3) RETURNING *'
  const values = [req.body.author_id, req.params.issue_id, req.body.comment]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default commentRouter

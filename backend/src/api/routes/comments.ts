import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import {
  validateCommentDelete,
  validateCommentGet,
  validateCommentPatch,
  validateCommentPost,
} from '../validators/comments_validation.js'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'

const commentRouter = Router({ mergeParams: true })

// Create new comment
commentRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateCommentPost(user, req.params.issue_id, req.body.comment)

  const text =
    'INSERT INTO comments (author_id, issue_id, comment) VALUES ($1, $2, $3) RETURNING *'
  const values = [user.sub, req.params.issue_id, req.body.comment]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

commentRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateCommentGet(user, req.params.issue_id)

  const text = `SELECT * FROM comments WHERE issue_id = $1 ORDER BY created_at ASC`
  const values = [req.params.issue_id]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

commentRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateCommentPatch(user, req.params.id, req.body.comment)

  const text =
    'UPDATE comments SET comment = $1 WHERE id = $2 AND author_id = $3 RETURNING *'
  const values = [req.body.comment, req.params.id, user.sub]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

commentRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateCommentDelete(user, req.params.id)

  const text = `
    DELETE FROM comments
    WHERE id = $1
    `

  const values = [req.params.id]

  try {
    await pool.query(text, values)
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default commentRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { validateCommentPost } from '../validators/comments_validation.js'
import { getIssue } from '../../db/services/issueServies.js'
import { AppError } from '../errors/AppError.js'

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

commentRouter.get<{ issue_id: string }>('/', async (req, res) => {
  const issue = await getIssue(req.params.issue_id)
  if (!issue) throw new AppError('ISSUE_NOT_FOUND')

  const text = `SELECT * FROM comments WHERE issue_id = $1 ORDER BY created_at ASC`
  const values = [req.params.issue_id]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

commentRouter.get('/:id', async (req, res) => {
  const text = `SELECT * FROM comments WHERE id = $1`
  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rows.length === 0) throw new AppError('COMMENT_NOT_FOUND')
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default commentRouter

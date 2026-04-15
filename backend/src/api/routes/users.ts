import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import {
  validateUserPatch,
  validateUserPost,
} from '../validators/users_validation.js'

const userRouter = Router()

userRouter.post('/', async (req, res) => {
  validateUserPost(req)

  const text = 'INSERT INTO users (username) VALUES ($1) RETURNING *'
  const values = [req.body.username]

  try {
    const result = await pool.query(text, values)
    res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

userRouter.get('/:id', async (req, res) => {
  const text = 'SELECT * FROM users WHERE id = $1'
  const values = [req.params.id]
  const result = await pool.query(text, values)

  if (result.rowCount === 0) {
    throw new AppError('USER_NOT_FOUND')
  }

  res.status(200).json(result.rows[0])
})

userRouter.patch('/:id', async (req, res) => {
  validateUserPatch(req)

  const text = 'UPDATE users SET username = $1 WHERE id = $2 RETURNING *'
  const values = [req.body.username, req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('USER_NOT_FOUND')
    }
    res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

userRouter.delete('/:id', async (req, res) => {
  const text =
    'UPDATE users SET deactivated_at = now() WHERE id = $1 RETURNING *'
  const values = [req.params.id]
  const result = await pool.query(text, values)

  if (result.rowCount === 0) {
    throw new AppError('USER_NOT_FOUND')
  }

  res.status(200).json(result.rows[0])
})

export default userRouter

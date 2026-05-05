import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import {
  validateProfilePatch,
  validateProfilePost,
} from '../validators/profiles_validation.js'

const profileRouter = Router()

profileRouter.post('/', async (req, res) => {
  validateProfilePost(req)

  const text = 'INSERT INTO profiles (username) VALUES ($1) RETURNING *'
  const values = [req.body.username]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

profileRouter.get('/:id', async (req, res) => {
  const text = 'SELECT * FROM profiles WHERE id = $1'
  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('USER_NOT_FOUND')
    }
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

profileRouter.patch('/:id', async (req, res) => {
  validateProfilePatch(req)

  const text = 'UPDATE profiles SET username = $1 WHERE id = $2 RETURNING *'
  const values = [req.body.username, req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('USER_NOT_FOUND')
    }
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

profileRouter.delete('/:id', async (req, res) => {
  const text =
    'UPDATE profiles SET deactivated_at = now() WHERE id = $1 RETURNING *'
  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('USER_NOT_FOUND')
    }
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default profileRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import { validateProfilePatch } from '../validators/profiles_validation.js'
import type { AuthenticatedRequest } from '../../types/authenticatedRequest.js'

const profileRouter = Router()

profileRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
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

profileRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const username = req.body.username
  const id = req.params.id
  const user = (req as AuthenticatedRequest).user

  validateProfilePatch(username, id, user)

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

profileRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  if (!req.user || req.user.sub !== req.params.id)
    throw new AppError('UNAUTHORIZED_REQUEST')

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

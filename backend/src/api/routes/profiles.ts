import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { getByIdSchema, usernameSchema } from '@issue-tracker/shared'

const profileRouter = Router()

profileRouter.get(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.id as string,
  })),
  async (req, res) => {
    const text = 'SELECT * FROM profiles WHERE id = $1'
    const values = [res.locals.validated.id]

    try {
      const result = await pool.query(text, values)
      if (result.rowCount === 0) {
        throw new AppError('USER_NOT_FOUND')
      }
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

profileRouter.get(
  '/',
  validateRequest(usernameSchema, (req) => ({
    username: req.query.user as string,
  })),
  async (req, res) => {
    const text = 'SELECT * FROM profiles WHERE username = $1'
    const values = [res.locals.validated.username]

    try {
      const result = await pool.query(text, values)
      if (result.rowCount === 0) {
        throw new AppError('USER_NOT_FOUND')
      }
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

export default profileRouter

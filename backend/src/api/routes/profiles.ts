import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  deleteProjectContributorSchema,
  getByIdSchema,
  updateProfileSchema,
  usernameSchema,
} from '@issue-tracker/shared'

const profileRouter = Router()

profileRouter.get('/me', async (req, res) => {
  const user = req.user as JwtUser

  const text = 'SELECT * FROM profiles WHERE id = $1'
  const values = [user.sub]

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

profileRouter.get(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.id as string,
  })),
  async (req, res) => {
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
  },
)

/*
  TODO: Reconsider. No getting by email or returning emails allowed.
*/
profileRouter.get(
  '/',
  validateRequest(usernameSchema, (req) => req.query.user as string),
  async (req, res) => {
    if (!req.query.user) throw new AppError('MISSING_USER_QUERY')

    const text = 'SELECT * FROM profiles WHERE username = $1 OR email = $1'
    const values = [req.query.user]

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

profileRouter.patch(
  '/me',
  validateRequest(updateProfileSchema, (req) => ({
    id: req.user?.sub as string,
    username: req.body.username,
  })),
  async (req, res) => {
    const text = 'UPDATE profiles SET username = $1 WHERE id = $2 RETURNING *'
    const values = [res.locals.validated.username, res.locals.validated.id]

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

profileRouter.delete('/me', async (req, res) => {
  const text =
    'UPDATE profiles SET deactivated_at = now() WHERE id = $1 RETURNING *'
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
})

// this is NOT the standard get route for profiles
// this gets contributors by user id
profileRouter.get('/me/contributors', async (req, res) => {
  const text = `
        SELECT 
          p.username,
          pc.*
        FROM profiles p
        LEFT JOIN project_contributors pc
          ON p.id = pc.user_id
        WHERE p.id = $1
        ORDER BY pc.joined_at
    `
  const values = [req.user?.sub]

  try {
    const result = await pool.query(text, values)

    if (result.rowCount === 0) {
      // if no row, no profile
      throw new AppError('USER_NOT_FOUND')
    } else if (result.rowCount === 1 && result.rows[0].user_id === null) {
      // if 1 row w/ null user_id, no contributors
      return res.status(200).send([])
    } else {
      // profile w/ contributors
      return res.status(200).send(result.rows)
    }
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

// delete contributor row as invitee, not delete profile
profileRouter.delete(
  '/me/contributors/:project_id',
  validateRequest(deleteProjectContributorSchema, (req) => ({
    user_id: req.user?.sub as string,
    project_id: req.params.project_id as string,
  })),
  async (req, res) => {
    const text = `
    DELETE FROM project_contributors
    WHERE user_id = $1
    AND project_id = $2
    `

    const values = [
      res.locals.validated.user_id,
      res.locals.validated.project_id,
    ]

    try {
      const result = await pool.query(text, values)
      if (result.rowCount === 0) throw new AppError('CONTRIBUTOR_NOT_FOUND')

      res.sendStatus(204)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)
export default profileRouter

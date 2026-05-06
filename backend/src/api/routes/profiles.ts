import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import { validateProfilePatch } from '../validators/profiles_validation.js'
import type { AuthenticatedRequest } from '../../types/authenticatedRequest.js'
import {
  validateContributorsDelete,
  validateContributorsGet,
} from '../validators/project_contributors_validation.js'

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

profileRouter.get(
  '/:id/contributors',
  async (req: AuthenticatedRequest, res) => {
    const id = req.params.id as string

    await validateContributorsGet(req.user, id, 'user')

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
    const values = [id]

    try {
      const result = await pool.query(text, values)

      if (result.rowCount === 0) {
        // if no row, no project
        throw new AppError('USER_NOT_FOUND')
      } else if (result.rowCount === 1 && result.rows[0].user_id === null) {
        // if 1 row w/ null user_id, no contributors
        return res.status(200).send([])
      } else {
        // project w/ contributors
        return res.status(200).send(result.rows)
      }
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

profileRouter.delete(
  '/:user_id/contributors/:project_id',
  async (req: AuthenticatedRequest, res) => {
    const { user_id, project_id } = req.params as {
      user_id: string
      project_id: string
    }
    await validateContributorsDelete(req.user, project_id, user_id, 'user')

    const text = `
    DELETE FROM project_contributors
    WHERE user_id = $1
    AND project_id = $2
    `

    const values = [user_id, project_id]

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

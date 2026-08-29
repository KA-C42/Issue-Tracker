import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  getByIdSchema,
  inviteRecipientResponseSchema,
  updateProfileSchema,
  usernameSchema,
} from '@issue-tracker/shared'
import { buildInviteGetQuery } from '../queries/inviteQueryBuilders.js'

const meRouter = Router()

meRouter.get('/profile', async (req, res) => {
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

meRouter.patch(
  '/profile',
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

meRouter.delete('/profile', async (req, res) => {
  const user = req.user as JwtUser

  const text =
    'UPDATE profiles SET deactivated_at = now() WHERE id = $1 RETURNING *'
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

meRouter.get('/projects', async (req, res) => {
  const user = req.user as JwtUser

  const text = `
        SELECT p.* 
        FROM projects p 
        LEFT JOIN project_contributors pc
        ON pc.project_id = p.id
        WHERE p.creator_id = $1
        OR pc.user_id = $1
        ORDER BY 
          CASE WHEN p.creator_id = $1 THEN 0 ELSE 1 END,
          CASE WHEN p.creator_id = $1 THEN p.created_at ELSE pc.joined_at END ASC
        `
  const values = [user.sub]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

meRouter.get('/issues', async (req, res) => {
  const user = req.user as JwtUser

  const text = `
    SELECT * FROM issues 
    WHERE assignee_id = $1
    ORDER BY CASE status 
      WHEN 'BACKLOG' THEN 1
      WHEN 'IN_PROGRESS' THEN 2
      WHEN 'DONE' THEN 3
    END, modified_at
    `
  const values = [user.sub]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

meRouter.get('/invites', async (req, res) => {
  const user = req.user as JwtUser

  const { text, values } = buildInviteGetQuery(undefined, user.sub)

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

meRouter.patch(
  '/invites/:id',
  validateRequest(inviteRecipientResponseSchema, (req) => ({
    id: req.params.id as string,
    status: req.body.status,
  })),
  async (req, res) => {
    const user = req.user as JwtUser

    const text = `UPDATE invites
      SET status = $1
      WHERE id = $2
      RETURNING *
      `
    const values = [res.locals.validated.status, res.locals.validated.id]

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

export default meRouter

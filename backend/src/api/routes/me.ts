import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  deleteProjectContributorSchema,
  inviteRecipientResponseSchema,
  usernameSchema,
} from '@issue-tracker/shared'
import { buildInviteGetQuery } from '../queries/inviteQueryBuilders.js'
import { isInvitee, requireRule } from '../middleware/authorize.js'
import { loadInvite } from '../middleware/loadRequest.js'

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
  validateRequest(usernameSchema, (req) => ({
    username: req.body.username,
  })),
  async (req, res) => {
    const text = 'UPDATE profiles SET username = $1 WHERE id = $2 RETURNING *'
    const values = [res.locals.validated.username, req.user?.sub]

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
  loadInvite((req, res) => res.locals.validated.id),
  requireRule(isInvitee),
  async (req, res) => {
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

meRouter.get('/contributors', async (req, res) => {
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
meRouter.delete(
  '/contributors/:project_id',
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

export default meRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { buildInviteGetQuery } from '../queries/inviteQueryBuilders.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  createInviteSchema,
  getByIdSchema,
  inviteSenderResponseSchema,
} from '@issue-tracker/shared'
import {
  anyOf,
  isProjectCreator,
  isProjectMember,
  isSender,
  requireRule,
} from '../middleware/authorize.js'
import {
  loadContributor,
  loadInvite,
  loadProfile,
  loadProject,
} from '../middleware/loadRequest.js'
import { AppError } from '../errors/AppError.js'

const inviteRouter = Router({ mergeParams: true })

// Create new invite
inviteRouter.post<{ project_id: string }>(
  '/',
  validateRequest(createInviteSchema, (req) => ({
    sender_id: req.user?.sub as string,
    project_id: req.params.project_id as string,
    ...req.body,
  })),
  loadProfile((req, res) => res.locals.validated.recipient_id),
  loadProject((req, res) => res.locals.validated.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.validated.project_id,
    user_id: res.locals.validated.sender_id,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    const text =
      'INSERT INTO invites (sender_id, recipient_id, project_id) VALUES ($1, $2, $3) RETURNING *'
    const values = [
      res.locals.validated.sender_id,
      res.locals.validated.recipient_id,
      res.locals.validated.project_id,
    ]

    try {
      const result = await pool.query(text, values)
      return res.status(201).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

//
// see ./me.ts meRouter for get and patch routes specific to session user
//

inviteRouter.get<{ project_id: string }>(
  '/',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.project_id as string,
  })),
  loadProject((req, res) => res.locals.validated.id),
  requireRule(isProjectMember),
  async (req, res) => {
    const { text, values } = buildInviteGetQuery(
      res.locals.validated.id,
      undefined,
    )

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

inviteRouter.patch(
  '/:id',
  validateRequest(inviteSenderResponseSchema, (req) => ({
    id: req.params.id as string,
    status: req.body.status,
  })),
  loadInvite((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.invite.project_id),
  requireRule(anyOf(isProjectCreator, isSender)),
  async (req, res) => {
    if (res.locals.invite.status !== 'PENDING')
      throw new AppError('INVITE_NOT_PENDING')

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

export default inviteRouter

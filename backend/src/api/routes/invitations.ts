import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import {
  validateInviteGet,
  validateInvitePatch,
  validateInvitePost,
} from '../validators/invitations_validation.js'
import { buildInviteGetQuery } from '../queries/invitationQueryBuilders.js'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'

const invitationRouter = Router({ mergeParams: true })

// Create new invitation
invitationRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateInvitePost(user, req.body.receiver_id, req.params.project_id)

  const text =
    'INSERT INTO invitations (sender_id, receiver_id, project_id) VALUES ($1, $2, $3) RETURNING *'
  const values = [user.sub, req.body.receiver_id, req.params.project_id]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

invitationRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  const { project_id, receiver_id } = req.query as {
    project_id?: string
    receiver_id?: string
  }
  await validateInviteGet(user, project_id, receiver_id)

  const { text, values } = buildInviteGetQuery(project_id, receiver_id)

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

invitationRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateInvitePatch(user, req.params.id, req.body.status)

  const text = `UPDATE invitations
    SET status = $1
    WHERE id = $2
    RETURNING *
    `
  const values = [req.body.status, req.params.id]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default invitationRouter

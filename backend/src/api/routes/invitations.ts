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

const invitationRouter = Router({ mergeParams: true })

// Create new invitation
invitationRouter.post<{ project_id: string }>('/', async (req, res) => {
  await validateInvitePost(
    req.body.sender_id,
    req.body.receiver_id,
    req.params.project_id,
  )

  const text =
    'INSERT INTO invitations (sender_id, receiver_id, project_id) VALUES ($1, $2, $3) RETURNING *'
  const values = [
    req.body.sender_id,
    req.body.receiver_id,
    req.params.project_id,
  ]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

invitationRouter.get('/', async (req, res) => {
  await validateInviteGet(
    req.query.project_id as string,
    req.query.receiver_id as string,
  )
  const { text, values } = buildInviteGetQuery(
    req.query.project_id as string,
    req.query.receiver_id as string,
  )

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

invitationRouter.patch('/:id', async (req, res) => {
  await validateInvitePatch(req.params.id as string, req.body.status as string)

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

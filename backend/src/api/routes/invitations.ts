import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { validateInvitePost } from '../validators/invitations_validation.js'

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

export default invitationRouter

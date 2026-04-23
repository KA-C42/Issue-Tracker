import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { AppError } from '../errors/AppError.js'
import { getUser } from '../../db/services/userServices.js'
import { getProject } from '../../db/services/project.services.js'

const invitationRouter = Router({ mergeParams: true })

// Create new invitation
invitationRouter.post<{ project_id: string }>('/', async (req, res) => {
  if (req.body.sender_id) {
    const sender = await getUser(req.body.sender_id)
    if (!sender) throw new AppError('SENDER_NOT_FOUND')
  } else throw new AppError('MISSING_SENDER_ID')

  if (req.body.receiver_id) {
    const receiver = await getUser(req.body.receiver_id)
    if (!receiver) throw new AppError('RECEIVER_NOT_FOUND')
  } else throw new AppError('MISSING_RECEIVER_ID')

  const project = await getProject(req.params.project_id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')

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

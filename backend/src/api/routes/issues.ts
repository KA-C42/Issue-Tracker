import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import {
  buildIssueGetQuery,
  buildIssuePatchQuery,
  buildIssuePostQuery,
} from '../queries/issueQueryBuilders.js'
import {
  validateIssueDelete,
  validateIssueGet,
  validateIssuePatch,
  validateIssuePost,
} from '../validators/issues_validation.js'
import { AppError } from '../errors/AppError.js'
import type { IssueStatus } from '../../types/enums.js'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'
import { isProjectMember } from '../../db/services/project.services.js'

const issueRouter = Router({ mergeParams: true })

// Create new issue
issueRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateIssuePost(user, req.body, req.params.project_id)

  const { text, values } = buildIssuePostQuery({
    creator_id: user.sub,
    ...req.body,
    project_id: req.params.project_id,
  })

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.get('/', async (req: AuthenticatedRequest, res) => {
  const { assignee_id, status } = req.query as {
    assignee_id?: string
    status?: IssueStatus
  }
  const user = req.user as JwtUser
  await validateIssueGet(user, req.params.project_id, assignee_id)

  const { text, values } = buildIssueGetQuery(
    user.sub,
    req.params.project_id,
    assignee_id,
    status,
  )

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

// this route validates after request to minimize DB requests
// may change when I revisit for my validation pass later
issueRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  const text = 'SELECT * FROM issues WHERE id = $1'

  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rows.length === 0) throw new AppError('ISSUE_NOT_FOUND')

    const isMember = await isProjectMember(result.rows[0].project_id, user.sub)
    if (!isMember) throw new AppError('UNAUTHORIZED_REQUEST')

    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateIssuePatch(user, req.params.id, req.body)

  const { text, values } = buildIssuePatchQuery(req.params.id, req.body)

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateIssueDelete(user, req.params.id)

  const text = `
    DELETE FROM issues
    WHERE id = $1
    `

  const values = [req.params.id]

  try {
    await pool.query(text, values)
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default issueRouter

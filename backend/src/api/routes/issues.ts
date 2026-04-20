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
  validateIssueGet,
  validateIssuePatch,
  validateIssuePost,
} from '../validators/issues_validation.js'
import { AppError } from '../errors/AppError.js'
import type { IssueStatus } from '../../types/enums.js'

const issueRouter = Router({ mergeParams: true })

// Create new issue
issueRouter.post<{ project_id: string }>('/', async (req, res) => {
  await validateIssuePost({ ...req.body, project_id: req.params.project_id })

  const { text, values } = buildIssuePostQuery({
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

issueRouter.get<{ project_id?: string }>('/', async (req, res) => {
  await validateIssueGet(
    req.params.project_id,
    req.query.assignee_id as string,
    undefined,
  )

  const { text, values } = buildIssueGetQuery(
    req.params.project_id,
    req.query.assignee_id as string,
    req.query.status as IssueStatus,
  )

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.get('/:id', async (req, res) => {
  const text = 'SELECT * FROM issues WHERE id = $1'

  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rows.length === 0) throw new AppError('ISSUE_NOT_FOUND')
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.patch('/:id', async (req, res) => {
  await validateIssuePatch(
    req.params.id,
    req.body.title,
    req.body.details,
    req.body.status,
    req.body.assignee_id,
  )

  const { text, values } = buildIssuePatchQuery(
    req.params.id,
    req.body.title,
    req.body.details,
    req.body.status,
    req.body.assignee_id,
  )

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

issueRouter.delete('/:id', async (req, res) => {
  const text = `
    DELETE FROM issues
    WHERE id = $1
    RETURNING *
    `

  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('ISSUE_NOT_FOUND')
    }
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default issueRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { buildIssuePostQuery } from '../queries/issueQueryBuilders.js'
import { validateIssuePost } from '../validators/issues_validation.js'

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

export default issueRouter

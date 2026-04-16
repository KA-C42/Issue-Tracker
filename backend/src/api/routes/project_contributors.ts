import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'
import {
  validateContributorsDelete,
  validateContributorsPost,
} from '../validators/project_contributors_validation.js'
import { buildContributorGetQuery } from '../queries/contributorGetQuery.js'

const projectContributorRouter = Router()

projectContributorRouter.post('/', async (req, res) => {
  validateContributorsPost(req.body)

  const text =
    'INSERT INTO project_contributors (user_id, project_id) VALUES ($1, $2) RETURNING *'
  const values = [req.body.user_id, req.body.project_id]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectContributorRouter.get('/', async (req, res) => {
  const { text, values, notFoundError } = buildContributorGetQuery(req.query)

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError(notFoundError)
    }

    // if user/project found but no contributor rows, return empty array
    const hasNoContributors = result.rows[0].user_id === null
    const contributorRows = hasNoContributors ? [] : result.rows

    return res.status(200).json(contributorRows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectContributorRouter.delete('/', async (req, res) => {
  validateContributorsDelete(req.query)

  const values = [req.query.project_id, req.query.user_id]
  const text =
    'DELETE FROM project_contributors WHERE project_id = $1 AND user_id = $2'

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('CONTRIBUTOR_NOT_FOUND')
    }
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default projectContributorRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { DbError } from '../errors/DbError.js'

const projectContributorRouter = Router()

projectContributorRouter.post('/', async (req, res) => {
  if (!req.body.user_id) {
    throw new AppError('MISSING_USER_ID')
  }

  if (!req.body.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }

  const text =
    'INSERT INTO project_contributors (user_id, project_id) VALUES ($1, $2) RETURNING *'
  const values = [req.body.user_id, req.body.project_id]

  try {
    const result = await pool.query(text, values)
    res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectContributorRouter.get('/', async (req, res) => {
  let result
  // route handles search by user_id or project_id via below ifs
  if (req.query.user_id) {
    // by user_id here!
    const values = [req.query.user_id]

    const text = `
    SELECT 
      users.username,
      project_contributors.user_id, 
      project_contributors.project_id, 
      project_contributors.joined_at
    FROM users
    LEFT JOIN project_contributors ON users.id = project_contributors.user_id
    WHERE users.id = $1
    ORDER BY project_contributors.joined_at
    `

    result = await pool.query(text, values)

    if (result.rowCount === 0) {
      throw new AppError('USER_NOT_FOUND')
    }
  } else if (req.query.project_id) {
    // by project_id here!
    const values = [req.query.project_id]

    const text = `
    SELECT 
      projects.name,
      project_contributors.user_id, 
      project_contributors.project_id, 
      project_contributors.joined_at
    FROM projects
    LEFT JOIN project_contributors ON projects.id = project_contributors.project_id
    WHERE projects.id = $1
    ORDER BY project_contributors.joined_at
    `

    result = await pool.query(text, values)

    if (result.rowCount === 0) {
      throw new AppError('PROJECT_NOT_FOUND')
    }
  } else {
    // no project or user id provided :(
    throw new AppError('MISSING_QUERYABLE_ID')
  }

  // if user/project found but no contributor rows, return empty array
  const contributorRows = result.rows[0].user_id === null ? [] : result.rows
  res.status(200).json(contributorRows)
})

projectContributorRouter.delete('/', async (req, res) => {
  if (!req.query.project_id && !req.query.user_id) {
    throw new AppError('MISSING_QUERY')
  }
  if (!req.query.project_id) {
    throw new AppError('MISSING_PROJECT_ID')
  }
  if (!req.query.user_id) {
    throw new AppError('MISSING_USER_ID')
  }

  const values = [req.query.project_id, req.query.user_id]
  const text =
    'DELETE FROM project_contributors WHERE project_id = $1 AND user_id = $2'

  const result = await pool.query(text, values)
  if (result.rowCount === 0) {
    throw new AppError('CONTRIBUTOR_NOT_FOUND')
  }

  res.status(204).send()
})

export default projectContributorRouter

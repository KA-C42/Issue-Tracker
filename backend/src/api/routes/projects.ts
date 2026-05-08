import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import {
  validateProjectDelete,
  validateProjectGet,
  validateProjectPatch,
  validateProjectPost,
} from '../validators/projects_validation.js'
import {
  buildProjectPatchQuery,
  type projectPatchReqBody,
} from '../queries/projectPatchQuery.js'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'
import {
  validateContributorsDelete,
  validateContributorsGet,
} from '../validators/project_contributors_validation.js'

const projectRouter = Router()

// Create new project
projectRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  validateProjectPost(req.body)

  const text =
    'INSERT INTO projects (owner_id, name, description, code) VALUES ($1, $2, $3, $4) RETURNING *'
  const values = [
    user.sub,
    req.body.name,
    req.body.description ?? null,
    req.body.code,
  ]

  try {
    const result = await pool.query(text, values)
    return res.status(201).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateProjectGet(user, req.params.id)

  const text = `SELECT * FROM projects WHERE id = $1`
  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

// Get projects by owner_id
// TODO: change to get all owned/contributing
// TODO: add auth to this route
projectRouter.get('/', async (req: AuthenticatedRequest, res) => {
  if (!req.query.owner_id) {
    throw new AppError('MISSING_OWNER_ID')
  }

  const text = 'SELECT * FROM projects WHERE owner_id = $1'
  const values = [req.query.owner_id]

  try {
    const result = await pool.query(text, values)
    return res.status(200).json(result.rows)
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectRouter.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateProjectPatch(user, req.params.id, req.body)

  const { text, values } = buildProjectPatchQuery(
    req.body as projectPatchReqBody,
    req.params.id as string,
  )

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('PROJECT_NOT_FOUND')
    }
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const user = req.user as JwtUser
  await validateProjectDelete(user, req.params.id)

  const text = `
    DELETE FROM projects
    WHERE id = $1
    RETURNING *
    `

  const values = [req.params.id]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('PROJECT_NOT_FOUND')
    }
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

// get contributors by project, not project
projectRouter.get(
  '/:id/contributors',
  async (req: AuthenticatedRequest, res) => {
    const user = req.user as JwtUser
    await validateContributorsGet(user, req.params.id, 'project')

    const text = `
        SELECT 
          p.name,
          pc.*
        FROM projects p
        LEFT JOIN project_contributors pc
          ON p.id = pc.project_id
        WHERE p.id = $1
        ORDER BY pc.joined_at
    `
    const values = [req.params.id]

    try {
      const result = await pool.query(text, values)

      if (result.rowCount === 0) {
        // if no row, no project
        throw new AppError('PROJECT_NOT_FOUND')
      } else if (result.rowCount === 1 && result.rows[0].user_id === null) {
        // if 1 row w/ null user_id, no contributors
        return res.status(200).send([])
      } else {
        // project w/ contributors
        return res.status(200).send(result.rows)
      }
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

projectRouter.delete<{ id: string; user_id: string }>(
  '/:project_id/contributors/:user_id',
  async (req: AuthenticatedRequest, res) => {
    const user = req.user as JwtUser
    const { project_id, user_id } = req.params as {
      project_id?: string
      user_id?: string
    }
    await validateContributorsDelete(user, project_id, user_id, 'project')

    const text = `
    DELETE FROM project_contributors
    WHERE project_id = $1
    AND user_id = $2
    `

    const values = [project_id, user_id]

    try {
      const result = await pool.query(text, values)
      if (result.rowCount === 0) throw new AppError('CONTRIBUTOR_NOT_FOUND')

      res.sendStatus(204)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

export default projectRouter

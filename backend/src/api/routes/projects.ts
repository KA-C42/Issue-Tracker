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
import type { AuthenticatedRequest } from '../../types/authenticatedRequest.js'
import {
  getProject,
  isProjectMember,
  isProjectOwner,
} from '../../db/services/project.services.js'

const projectRouter = Router()

// Create new project
projectRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const user = req.user
  if (!user) throw new AppError('UNAUTHORIZED_REQUEST')

  validateProjectPost(req.body)

  const text =
    'INSERT INTO projects (name, description, owner_id, code) VALUES ($1, $2, $3, $4) RETURNING *'
  const values = [
    req.body.name,
    req.body.description ?? null,
    user.sub,
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
  const { user, projectId } = validateProjectGet(req.params.id, req.user)
  const authorized = await isProjectMember(projectId, user.sub)

  const text = `SELECT * FROM projects WHERE id = $1` // be owner or contributor
  const values = [projectId]

  try {
    const result = await pool.query(text, values)

    // Differentiating despite security cost because this is a portfolio/practice project
    if (result.rowCount !== 0) {
      if (authorized) {
        return res.status(200).json(result.rows[0])
      } else {
        throw new AppError('UNAUTHORIZED_REQUEST')
      }
    } else {
      throw new AppError('PROJECT_NOT_FOUND')
    }
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

// Get projects by owner_id
projectRouter.get('/', async (req, res) => {
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
  const { id, user } = validateProjectPatch(req.params.id, req.body, req.user)

  const [text, values] = buildProjectPatchQuery(
    req.body as projectPatchReqBody,
    id,
  )

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      throw new AppError('PROJECT_NOT_FOUND')
    }
    await isProjectOwner(id, user.sub)
    return res.status(200).json(result.rows[0])
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

projectRouter.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { id, user } = validateProjectDelete(req.params.id, req.user)

  const text = `
    DELETE FROM projects
    WHERE id = $1
    AND owner_id = $2
    RETURNING *
    `

  const values = [id, user.sub]

  try {
    const result = await pool.query(text, values)
    if (result.rowCount === 0) {
      if (await getProject(id)) {
        throw new AppError('UNAUTHORIZED_REQUEST')
      } else {
        throw new AppError('PROJECT_NOT_FOUND')
      }
    }
    return res.status(204).send()
  } catch (err) {
    dbErrorMapper(err as DbError)
  }
})

export default projectRouter

import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import { buildProjectPatchQuery } from '../queries/projectPatchQuery.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  createProjectSchema,
  deleteProjectContributorSchema,
  getByIdSchema,
  updateProjectSchema,
  type UpdateProjectInput,
} from '@issue-tracker/shared'
import {
  isProjectCreator,
  isProjectMember,
  requireRule,
} from '../middleware/authorize.js'
import { loadContributor, loadProject } from '../middleware/loadRequest.js'

const projectRouter = Router()

// Create new project
projectRouter.post(
  '/',
  validateRequest(createProjectSchema, (req) => ({
    title: req.body.title,
    code: req.body.code,
    description: req.body.description,
  })),
  async (req, res) => {
    const text =
      'INSERT INTO projects (creator_id, title, description, code) VALUES ($1, $2, $3, $4) RETURNING *'
    const values = [
      req.user?.sub,
      res.locals.validated.title,
      res.locals.validated.description,
      res.locals.validated.code,
    ]

    try {
      const result = await pool.query(text, values)
      return res.status(201).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

projectRouter.get(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({ id: req.params.id as string })),
  loadProject((req, res) => res.locals.validated.id),
  loadContributor((req, res) => ({
    project_id: res.locals.validated.id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    res.status(200).json(res.locals.project)
  },
)

projectRouter.patch(
  '/:id',
  validateRequest(updateProjectSchema, (req) => ({
    id: req.params.id as string,
    body: req.body,
  })),
  loadProject((req, res) => res.locals.validated.id),
  requireRule(isProjectCreator),
  async (req, res) => {
    const { text, values } = buildProjectPatchQuery(
      res.locals.validated as UpdateProjectInput,
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
  },
)

projectRouter.delete(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({ id: req.params.id as string })),
  loadProject((req, res) => res.locals.validated.id),
  requireRule(isProjectCreator),
  async (req, res) => {
    const text = `
    DELETE FROM projects
    WHERE id = $1
    RETURNING *
    `

    const values = [res.locals.validated.id]

    try {
      const result = await pool.query(text, values)
      if (result.rowCount === 0) {
        throw new AppError('PROJECT_NOT_FOUND')
      }
      return res.status(204).send()
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

// get CONTRIBUTORS by project
projectRouter.get(
  '/:id/contributors',
  validateRequest(getByIdSchema, (req) => ({ id: req.params.id as string })),
  loadProject((req, res) => res.locals.validated.id),
  loadContributor((req, res) => ({
    project_id: res.locals.validated.id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    const text = `
      SELECT * FROM project_contributors
      WHERE project_id = $1
      ORDER BY joined_at
    `
    const values = [res.locals.validated.id]

    try {
      const result = await pool.query(text, values)
      return res.status(200).send(result.rows)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

projectRouter.delete(
  '/:project_id/contributors/:user_id',
  validateRequest(deleteProjectContributorSchema, (req) => ({
    user_id: req.params.user_id as string,
    project_id: req.params.project_id as string,
  })),
  loadProject((req, res) => res.locals.validated.project_id),
  requireRule(isProjectCreator),
  async (req, res) => {
    if (res.locals.validated.user_id === res.locals.project.creator_id)
      throw new AppError('CANNOT_REMOVE_OWNER')

    const text = `
    DELETE FROM project_contributors
    WHERE project_id = $1
    AND user_id = $2
    `

    const values = [
      res.locals.validated.project_id,
      res.locals.validated.user_id,
    ]

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

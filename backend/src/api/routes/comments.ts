import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import {
  createCommentSchema,
  getByIdSchema,
  updateCommentSchema,
} from '@issue-tracker/shared'
import {
  loadComment,
  loadContributor,
  loadIssue,
  loadProject,
} from '../middleware/loadRequest.js'
import {
  anyOf,
  isCommentCreator,
  isProjectCreator,
  isProjectMember,
  requireRule,
} from '../middleware/authorize.js'
import { validateRequest } from '../middleware/validateRequest.js'

const commentRouter = Router({ mergeParams: true })

// Create new comment
commentRouter.post<{ issue_id: string }>(
  '/',
  validateRequest(createCommentSchema, (req) => ({
    issue_id: req.params.issue_id as string,
    comment: req.body.comment,
  })),
  loadIssue((req, res) => res.locals.validated.issue_id),
  loadProject((req, res) => res.locals.issue.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.issue.project_id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res, next) => {
    const user = req.user as JwtUser

    const text =
      'INSERT INTO comments (creator_id, issue_id, comment) VALUES ($1, $2, $3) RETURNING *'
    const values = [
      user.sub,
      res.locals.validated.issue_id,
      res.locals.validated.comment,
    ]

    try {
      const dbResult = await pool.query(text, values)
      return res.status(201).json(dbResult.rows[0])
    } catch (err) {
      return next(dbErrorMapper(err as DbError))
    }
  },
)

commentRouter.get<{ issue_id: string }>(
  '/',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.issue_id as string,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  requireRule(isProjectMember),
  async (req, res) => {
    const text = `SELECT * FROM comments WHERE issue_id = $1 ORDER BY created_at ASC`
    const values = [res.locals.validated.id]

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

commentRouter.patch(
  '/:id',
  validateRequest(updateCommentSchema, (req) => ({
    id: req.params.id as string,
    ...req.body,
  })),
  loadComment((req, res) => res.locals.validated.id),
  requireRule(isCommentCreator),
  async (req, res) => {
    const user = req.user as JwtUser

    const text =
      'UPDATE comments SET comment = $1 WHERE id = $2 AND creator_id = $3 RETURNING *'
    const values = [
      res.locals.validated.comment,
      res.locals.validated.id,
      user.sub,
    ]

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

commentRouter.delete(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.id as string,
  })),
  loadComment((req, res) => res.locals.validated.id),
  loadIssue((req, res) => res.locals.comment.issue_id),
  loadProject((req, res) => res.locals.issue.project_id),
  requireRule(anyOf(isProjectCreator, isCommentCreator)),
  async (req, res) => {
    const text = `
    DELETE FROM comments
    WHERE id = $1
    `

    const values = [res.locals.validated.id]

    try {
      await pool.query(text, values)
      return res.status(204).send()
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

export default commentRouter

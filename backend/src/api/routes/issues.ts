import { Router } from 'express'
import { pool } from '../../db/pool.js'
import type { DbError } from '../errors/DbError.js'
import dbErrorMapper from '../errors/dbErrorMapper.js'
import {
  buildIssueGetQuery,
  buildIssuePatchQuery,
  buildIssuePostQuery,
} from '../queries/issueQueryBuilders.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  createIssueSchema,
  getByIdSchema,
  getProjectIssuesSchema,
  updateIssueAssigneeSchema,
  updateIssueSchema,
  updateIssueStatusSchema,
  type UpdateIssueInput,
} from '@issue-tracker/shared'
import {
  allOf,
  anyOf,
  assigneeNullToSelf,
  isAssignee,
  isIssueCreator,
  isProjectCreator,
  isProjectMember,
  removingAssignee,
  requireRule,
} from '../middleware/authorize.js'
import {
  loadContributor,
  loadIssue,
  loadProject,
} from '../middleware/loadRequest.js'
import { checkMembership } from '../../db/services/project.services.js'
import { AppError } from '../errors/AppError.js'

const issueRouter = Router({ mergeParams: true })

// Create new issue
issueRouter.post<{ project_id: string }>(
  '/',
  validateRequest(createIssueSchema, (req) => ({
    project_id: req.params.project_id as string,
    ...req.body,
  })),
  loadProject((req, res) => res.locals.validated.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.validated.project_id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    const assignee_id = res.locals.validated.assignee_id
    if (assignee_id) {
      const assigneeIsMember = await checkMembership(
        assignee_id,
        res.locals.project,
      )
      if (!assigneeIsMember) throw new AppError('INVALID_ASSIGNEE')
    }
    const user = req.user as JwtUser
    const { text, values } = buildIssuePostQuery(user.sub, res.locals.validated)

    try {
      const result = await pool.query(text, values)
      return res.status(201).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

issueRouter.get<{ project_id: string }>(
  '/',
  validateRequest(getProjectIssuesSchema, (req) => ({
    project_id: req.params.project_id as string,
    ...req.query,
  })),
  loadProject((req, res) => res.locals.validated.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.validated.project_id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    const user = req.user as JwtUser

    const { text, values } = buildIssueGetQuery(
      user.sub,
      res.locals.validated.project_id,
      res.locals.validated.assignee_id,
      res.locals.validated.status,
    )

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows)
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

issueRouter.get(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.id as string,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.issue.project_id,
    user_id: req.user?.sub as string,
  })),
  requireRule(isProjectMember),
  async (req, res) => {
    return res.status(200).json(res.locals.issue)
  },
)

// General patch only available to:
// - Issue creator
// - Project creator
issueRouter.patch(
  '/:id',
  validateRequest(updateIssueSchema, (req) => ({
    id: req.params.id as string,
    ...req.body,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  requireRule(anyOf(isIssueCreator, isProjectCreator)),

  async (req, res) => {
    const assignee_id = res.locals.validated.assignee_id

    if (assignee_id) {
      const assigneeIsMember = await checkMembership(
        assignee_id,
        res.locals.project,
      )
      if (!assigneeIsMember) throw new AppError('INVALID_ASSIGNEE')
    }

    const { text, values } = buildIssuePatchQuery(
      res.locals.validated as UpdateIssueInput,
    )

    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

issueRouter.patch(
  '/:id/status',
  validateRequest(updateIssueStatusSchema, (req) => ({
    id: req.params.id as string,
    status: req.body.status,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  requireRule(anyOf(isProjectCreator, isIssueCreator, isAssignee)),

  async (req, res) => {
    const text = `
    UPDATE issues
    SET status = $1
    WHERE id = $2
    RETURNING *
    `
    const values = [res.locals.validated.status, res.locals.validated.id]
    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

issueRouter.patch(
  '/:id/assignee',
  validateRequest(updateIssueAssigneeSchema, (req) => ({
    id: req.params.id as string,
    assignee_id: req.body.assignee_id,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  loadContributor((req, res) => ({
    project_id: res.locals.project.id,
    user_id: req.user?.sub as string,
  })),
  requireRule(
    anyOf(
      isProjectCreator,
      isIssueCreator,
      allOf(isProjectMember, assigneeNullToSelf),
      allOf(isAssignee, removingAssignee),
    ),
  ),
  async (req, res) => {
    const assignee_id = res.locals.validated.assignee_id

    if (assignee_id) {
      const assigneeIsMember = await checkMembership(
        assignee_id,
        res.locals.project,
      )
      if (!assigneeIsMember) throw new AppError('INVALID_ASSIGNEE')
    }

    const text = `
    UPDATE issues
    SET assignee_id = $1
    WHERE id = $2
    RETURNING *
    `
    const values = [res.locals.validated.assignee_id, res.locals.validated.id]
    try {
      const result = await pool.query(text, values)
      return res.status(200).json(result.rows[0])
    } catch (err) {
      dbErrorMapper(err as DbError)
    }
  },
)

issueRouter.delete(
  '/:id',
  validateRequest(getByIdSchema, (req) => ({
    id: req.params.id as string,
  })),
  loadIssue((req, res) => res.locals.validated.id),
  loadProject((req, res) => res.locals.issue.project_id),
  requireRule(anyOf(isProjectCreator, isIssueCreator)),
  async (req, res) => {
    const text = `
    DELETE FROM issues
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

export default issueRouter

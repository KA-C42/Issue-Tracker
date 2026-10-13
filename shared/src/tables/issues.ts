import { z } from 'zod'
import { getByIdSchema, idSchema } from '../commonSchemas.js'

// STATUS
// enum enforced in db, any change in these requires a schema update
export const issueStatusSchema = z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE'])
export type IssueStatus = z.infer<typeof issueStatusSchema>

// ROW
export type Issue = {
  id: string
  creator_id: string
  project_id: string
  title: string
  details: string | null
  status: IssueStatus
  assignee_id: string | null
  code: number
  status_changed_at: string
  modified_at: string
  created_at: string
}

// REQUESTS

// POST /projects/:project_id/issues
export const createIssueSchema = z.object({
  project_id: z.uuid(),
  title: z.string().min(1).max(128, 'Title must be 128 or fewer characters'),
  details: z.string().nullable().optional(),
  status: issueStatusSchema.optional(),
  assignee_id: idSchema.nullable().optional(),
})
export type CreateIssueInput = z.infer<typeof createIssueSchema>

// GET /projects/:project_id/issues, optional ?status= and ?assignee_id= filters
export const getProjectIssuesSchema = createIssueSchema.pick({
  project_id: true,
  status: true,
  assignee_id: true,
})
export type GetProjectIssuesInput = z.infer<typeof getProjectIssuesSchema>

// PATCH /issues/:id: title and details only.
// Status and assignee each have their own route below.
export const updateIssueSchema = createIssueSchema
  .pick({ title: true, details: true })
  .partial()
  .extend({ id: idSchema })
  .refine((data) => Object.keys(data).length > 1, {
    error: 'At least one field must be provided',
    path: [],
  })
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>
export type UpdateIssueFields = Omit<UpdateIssueInput, 'id'>

// PATCH /issues/:id/status
export const updateIssueStatusSchema = z.object({
  id: idSchema,
  status: issueStatusSchema,
})
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>
export type UpdateIssueStatusFields = Pick<UpdateIssueStatusInput, 'status'>

// PATCH /issues/:id/assignee
export const updateIssueAssigneeSchema = z.object({
  id: idSchema,
  assignee_id: idSchema.nullable(),
})
export type UpdateIssueAssigneeInput = z.infer<typeof updateIssueAssigneeSchema>
export type UpdateIssueAssigneeFields = Pick<
  UpdateIssueAssigneeInput,
  'assignee_id'
>

// DELETE /issues/:id
export const deleteIssueSchema = getByIdSchema
export type DeleteIssueInput = z.infer<typeof deleteIssueSchema>

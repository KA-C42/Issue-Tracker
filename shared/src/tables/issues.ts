import { z } from 'zod'
import { getByIdSchema, idSchema } from '../commonSchemas.js'

// enum enforced in db, any change in these requires a schema update
export const issueStatusSchema = z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE'])
export type IssueStatus = z.infer<typeof issueStatusSchema>

export const createIssueSchema = z.object({
  project_id: z.uuid(),
  title: z.string().min(1),
  details: z.string().nullable().optional(),
  status: issueStatusSchema.optional(),
  assignee_id: z.uuid().nullable().optional(),
})
export type CreateIssueInput = z.infer<typeof createIssueSchema>

export const getProjectIssuesSchema = createIssueSchema.omit({
  title: true,
  details: true,
})
export type GetProjectIssuesInput = z.infer<typeof getProjectIssuesSchema>

const updateIssueBaseSchema = createIssueSchema
  .omit({ project_id: true })
  .partial()
  .extend({ id: z.uuid() })

export const updateIssueSchema = updateIssueBaseSchema.refine(
  (data) => Object.keys(data).length > 1,
  {
    error: 'At least one field must be provided',
    path: [],
  },
)
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>

export const updateIssueStatusSchema = updateIssueBaseSchema
  .omit({
    title: true,
    details: true,
    assignee_id: true,
    status: true,
  })
  .extend({ status: issueStatusSchema })

export const deleteIssueSchema = getByIdSchema
export type DeleteIssueInput = z.infer<typeof deleteIssueSchema>

export const updateIssueAssigneeSchema = z.object({
  id: idSchema,
  assignee_id: idSchema.nullable(),
})
export type UpdateIssueAssigneeInput = z.infer<typeof updateIssueAssigneeSchema>

export type Issue = CreateIssueInput & {
  status: IssueStatus
  id: string
  creator_id: string
  code: number
  status_changed_at: string
  modified_at: string
  created_at: string
}

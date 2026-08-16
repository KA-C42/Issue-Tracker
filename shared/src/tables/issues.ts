import { z } from 'zod'

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

export const updateIssueSchema = createIssueSchema
  .omit({ project_id: true })
  .partial()
  .extend({
    id: z.uuid(),
  })
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>

export const deleteIssueSchema = z.object({ id: z.uuid() })
export type DeleteIssueInput = z.infer<typeof deleteIssueSchema>

export type Issue = UpdateIssueInput & {
  creator_id: string
  code: number
  status_changed_at: string
  modified_at: string
  created_at: string
}

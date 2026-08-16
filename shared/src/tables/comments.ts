import { z } from 'zod'

export const createCommentSchema = z.object({
  issue_id: z.uuid(),
  comment: z.string(),
})
export type CreateCommentInput = z.infer<typeof createCommentSchema>

export const updateCommentSchema = createCommentSchema
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

export const deleteCommentSchema = z.object({ id: z.uuid() })
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>

export type Comment = CreateCommentInput &
  DeleteCommentInput & {
    author_id: string
    modified_at: string
    created_at: string
  }

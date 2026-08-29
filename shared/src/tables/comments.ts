import { z } from 'zod'
import { idSchema } from '../commonSchemas'

export const createCommentSchema = z.object({
  issue_id: idSchema,
  comment: z.string(),
})
export type CreateCommentInput = z.infer<typeof createCommentSchema>

export const updateCommentSchema = z
  .object({ id: idSchema })
  .merge(createCommentSchema.omit({ issue_id: true }))
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

export const deleteCommentSchema = z.object({ id: idSchema })
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>

export type Comment = CreateCommentInput &
  DeleteCommentInput & {
    creator_id: string
    modified_at: string
    created_at: string
  }

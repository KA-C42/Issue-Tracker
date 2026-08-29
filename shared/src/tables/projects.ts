import { z } from 'zod'
import { idSchema } from '../commonSchemas'

export const createProjectSchema = z.object({
  creator_id: idSchema,
  name: z.string(),
  code: z.string().length(4),
  description: z.string(),
})
export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  id: z.uuid(),
  body: createProjectSchema
    .omit({ creator_id: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      error: 'At least one field must be provided',
      path: [],
    }),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export type Project = CreateProjectInput & {
  id: z.infer<typeof idSchema>
  modified_at: string
  created_at: string
}

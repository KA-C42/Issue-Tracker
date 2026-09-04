import { z } from 'zod'
import { idSchema } from '../commonSchemas.js'

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(40, 'Title must be 40 or fewer characters'),
  description: z
    .string()
    .max(300, 'Description must not exceed 300 characters'),
  code: z.string().length(4, 'Code must be exactly 4 characters'),
})
export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  id: z.uuid(),
  body: createProjectSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      error: 'At least one field must be provided',
      path: [],
    }),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export type Project = CreateProjectInput & {
  id: z.infer<typeof idSchema>
  creator_id: string
  modified_at: string
  created_at: string
}

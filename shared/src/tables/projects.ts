import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string(),
  code: z.string().length(4),
  description: z.string(),
})
export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.uuid(),
})
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export type Project = UpdateProjectInput & {
  owner_id: string
  modified_at: string
  created_at: string
}

import { z } from 'zod'
import { idSchema } from '../commonSchemas.js'

export const projectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(40, 'Title must be 40 or fewer characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters'),
  code: z.string().length(4, 'Code must be exactly 4 characters'),
})
export type ProjectInput = z.infer<typeof projectSchema>

export const updateProjectSchema = z.object({
  id: z.uuid(),
  body: projectSchema.partial().refine((data) => Object.keys(data).length > 0, {
    error: 'At least one field must be provided',
    path: [],
  }),
})

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UpdateProjectFields = UpdateProjectInput['body']

export type Project = ProjectInput & {
  id: z.infer<typeof idSchema>
  creator_id: string
  modified_at: string
  created_at: string
}

type ProjectCardBase = Pick<Project, 'id' | 'title' | 'code'>

export type OwnedProjectSummary = ProjectCardBase & {
  open_issue_count: number
  member_count: number
  pending_invite_count: number
}

export type ContributingProjectSummary = ProjectCardBase & {
  creator_username: string
  assigned_open_issue_count: number
}

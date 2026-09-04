import { z } from 'zod'

export const deleteProjectContributorSchema = z.object({
  user_id: z.uuid(),
  project_id: z.uuid(),
})
export type RemoveProjectContributorInput = z.infer<
  typeof deleteProjectContributorSchema
>

export type ProjectContributor = RemoveProjectContributorInput & {
  joined_at: string
}

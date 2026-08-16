import { z } from 'zod'

export const updateProfileSchema = z.object({
  id: z.uuid(),
  username: z.string(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export type Profile = UpdateProfileInput & {
  email: string
  created_at: string
}

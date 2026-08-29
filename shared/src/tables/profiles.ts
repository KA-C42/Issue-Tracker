import { z } from 'zod'
import { idSchema } from '../commonSchemas'

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^\S+$/, 'Username cannot contain spaces')

export const updateProfileSchema = z.object({
  id: idSchema,
  username: usernameSchema,
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export type Profile = UpdateProfileInput & {
  email: string
  created_at: string
}

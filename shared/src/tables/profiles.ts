import { z } from 'zod'

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^\S+$/, 'Username cannot contain spaces'),
})

export type UpdateProfileInput = z.infer<typeof usernameSchema>

export type Profile = UpdateProfileInput & {
  id: string
  created_at: string
}

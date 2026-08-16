import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string(),
})

export type User = z.infer<typeof createUserSchema> & {
  id: string
}

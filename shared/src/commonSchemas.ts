import { z } from 'zod'

// Single source of truth for UUIDs / what is an ID.
// For use in schema objects, not for use in routes. See below
export const idSchema = z.uuid()

// Some routes only need id, but for shape consistency and
// friendliness towards shared middleware, prefer this in routes over plain idSchema/z.uuid()
export const getByIdSchema = z.object({
  id: idSchema,
})

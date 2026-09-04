import type { Request, RequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'
import { z } from 'zod'

export const validateRequest = <T extends z.ZodSchema>(
  schema: T,
  getData: (req: Request) => z.input<typeof schema>,
): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(getData(req))

    if (!parsed.success) {
      return next(new AppError('VALIDATION_ERROR', parsed.error.issues))
    }

    res.locals.validated = parsed.data
    next()
  }
}

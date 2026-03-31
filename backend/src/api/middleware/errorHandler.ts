import type { ErrorRequestHandler } from 'express'
import { getErrorDef } from '../errors/errorDefinitions.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  try {
    const error = getErrorDef(err.code)

    return res.status(error.statusCode).json({
      error: {
        code: err.code,
        message: error.message,
      },
    })
  } catch {
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: err.message || 'Internal Server Error',
      },
    })
  }
}

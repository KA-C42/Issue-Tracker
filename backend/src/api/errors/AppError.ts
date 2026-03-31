import { getErrorDef } from './errorDefinitions.js'

export class AppError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(code: string, details?: unknown) {
    const def = getErrorDef(code)

    super(def.message)
    this.code = code
    this.statusCode = def.statusCode
    this.details = details
  }
}

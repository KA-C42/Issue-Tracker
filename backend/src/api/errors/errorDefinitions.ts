type ErrorDictionary = {
  [key: string]: { statusCode: number; message: string }
}

export const ERROR_DEFS: ErrorDictionary = {
  // error middleware test
  ROUTE_NOT_FOUND: {
    statusCode: 404,
    message: 'Route not found',
  },

  // user route errors
  MISSING_USERNAME: {
    statusCode: 400,
    message: 'Invalid request due to missing username',
  },
  USER_NOT_FOUND: {
    statusCode: 404,
    message: 'Requested user not found',
  },
  USERNAME_CONFLICT: {
    statusCode: 409,
    message: 'Requested username is already in use',
  },
}

export function getErrorDef(code: string) {
  const def = ERROR_DEFS[code]
  if (!def) throw new Error(`Unknown error code: ${code}`)
  return def
}

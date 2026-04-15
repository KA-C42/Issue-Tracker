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

  // project route errors
  MISSING_OWNER_ID: {
    statusCode: 400,
    message: 'Invalid request due to missing owner_id',
  },
  MISSING_PROJECT_ID: {
    statusCode: 400,
    message: 'Invalid request due to missing project id',
  },
  MISSING_PROJECT_NAME: {
    statusCode: 400,
    message: 'Invalid request due to missing project name',
  },
  MISSING_PROJECT_CODE: {
    statusCode: 400,
    message: 'Invalid request due to missing project code',
  },
  PROJECT_NOT_FOUND: {
    statusCode: 404,
    message: 'Requested project not found',
  },
  PROJECT_NAME_CONFLICT: {
    statusCode: 409,
    message: 'Requested project name is already in use by the user',
  },
  NO_PROJECT_FIELDS_PROVIDED: {
    statusCode: 400,
    message:
      'Invalid request due to lack of updateable fields, provide name or description',
  },
  INVALID_CODE: {
    statusCode: 400,
    message:
      'Invalid project code. Code must consist of 1-4 alphanumeric characters',
  },

  // PROJECT_CONTRIBUTOR ERRORS
  MISSING_USER_ID: {
    statusCode: 400,
    message: 'Invalid request due to missing user_id',
  },
  MISSING_QUERYABLE_ID: {
    statusCode: 400,
    message:
      'Invalid request due to lack of queryable id (provide user_id or project_id)',
  },
  CONTRIBUTOR_NOT_FOUND: {
    statusCode: 404,
    message: 'Requested project contributor row not found',
  },
  ALREADY_MADE_CONTRIBUTOR: {
    statusCode: 409,
    message: 'User is already a contributor for this project',
  },
  MISSING_QUERY: {
    statusCode: 400,
    message: 'Please provide both a user_id and a project_id',
  },
}

export function getErrorDef(code: string) {
  const def = ERROR_DEFS[code]
  if (!def) throw new Error(`Unknown error code: ${code}`)
  return def
}

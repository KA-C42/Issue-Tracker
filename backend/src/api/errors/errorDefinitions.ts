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

  // issue errors
  MISSING_ISSUE_TITLE: {
    statusCode: 400,
    message: 'Please provide an issue title',
  },
  MISSING_CREATOR_ID: {
    statusCode: 400,
    message: 'Please provide a creator_id',
  },
  CREATOR_NOT_FOUND: {
    statusCode: 404,
    message: 'Requested creator_id not found in users',
  },
  ASSIGNEE_NOT_FOUND: {
    statusCode: 404,
    message: 'Requested creator_id not found in users',
  },
  INVALID_ASSIGNEE: {
    statusCode: 422,
    message: 'Requested assignee_id not owner or contributor to this project',
  },
  INVALID_CREATOR: {
    statusCode: 422,
    message: 'Requested creator_id not owner or contributor to this project',
  },
  ISSUE_TITLE_TAKEN: {
    statusCode: 409,
    message: 'Requested title in use by another issue in this project',
  },
  MISSING_SEARCH_PARAMETER: {
    statusCode: 400,
    message: 'Search parameter required for queries on this table',
  },
  ISSUE_NOT_FOUND: {
    statusCode: 404,
    message: 'Provided id does not match any issues',
  },
  MISSING_ISSUE_PATCH_FIELDS: {
    statusCode: 400,
    message: 'Please provide issue fields to patch',
  },

  // COMMENT ERRORS
  MISSING_AUTHOR_ID: {
    statusCode: 400,
    message: 'Please provide an author_id',
  },
  MISSING_COMMENT_TEXT: {
    statusCode: 400,
    message: 'Please provide comment text',
  },
  AUTHOR_NOT_FOUND: {
    statusCode: 404,
    message: 'Provided author_id does not match any users',
  },
  INVALID_AUTHOR: {
    statusCode: 422,
    message: 'author_id not permitted to comment within given project',
  },
  COMMENT_NOT_FOUND: {
    statusCode: 404,
    message: 'Provided id does not match any comments',
  },
  NOT_COMMENT_AUTHOR: {
    statusCode: 403,
    message: 'Provided id is not the original commenter',
  },
}

export function getErrorDef(code: string) {
  const def = ERROR_DEFS[code]
  if (!def) throw new Error(`Unknown error code: ${code}`)
  return def
}

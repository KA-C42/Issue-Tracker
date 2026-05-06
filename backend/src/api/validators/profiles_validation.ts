import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'

function validateProfilePost(req: Request) {
  if (!req.body || !req.body.username) {
    throw new AppError('MISSING_USERNAME')
  }
}

function validateProfilePatch(
  username: string,
  id: string | undefined,
  user: JwtUser | undefined,
) {
  if (!id) {
    throw new AppError('MISSING_USER_ID')
  }
  if (!username) {
    throw new AppError('MISSING_USERNAME')
  }
  if (!user || id !== user.sub) {
    throw new AppError('UNAUTHORIZED_REQUEST')
  }
}

export { validateProfilePost, validateProfilePatch }

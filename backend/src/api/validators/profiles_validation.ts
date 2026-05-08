import { AppError } from '../errors/AppError.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'

function validateProfilePatch(
  user: JwtUser,
  id: string | undefined,
  username: string | undefined,
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

export { validateProfilePatch }

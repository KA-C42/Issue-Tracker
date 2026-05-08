import { getInvitation } from '../../db/services/inviteServices.js'
import {
  getProject,
  isProjectMember,
  isProjectOwner,
} from '../../db/services/project.services.js'
import { getProfile } from '../../db/services/userServices.js'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

async function validateInvitePost(
  user: JwtUser,
  receiver_id: string | undefined,
  project_id: string | undefined,
) {
  if (receiver_id) {
    const receiver = await getProfile(receiver_id)
    if (!receiver) throw new AppError('RECEIVER_NOT_FOUND')
  } else throw new AppError('MISSING_RECEIVER_ID')

  if (project_id) {
    if (!(await isProjectMember(project_id, user.sub)))
      throw new AppError('UNAUTHORIZED_REQUEST')
  } else throw new AppError('MISSING_PROJECT_ID')
}

async function validateInviteGet(
  user: JwtUser,
  project_id: string | undefined,
  receiver_id: string | undefined,
) {
  if (project_id && receiver_id) throw new AppError('TOO_MANY_PARAMETERS')

  if (project_id) {
    const project = await getProject(project_id)
    if (!project) throw new AppError('PROJECT_NOT_FOUND')
    if (!(await isProjectMember(project_id, user.sub)))
      throw new AppError('UNAUTHORIZED_REQUEST')
  } else if (receiver_id) {
    if (user.sub !== receiver_id) throw new AppError('UNAUTHORIZED_REQUEST')
    const receiver = await getProfile(receiver_id)
    if (!receiver) throw new AppError('USER_NOT_FOUND')
  } else throw new AppError('MISSING_SEARCH_PARAMETER')
}

async function validateInvitePatch(
  user: JwtUser,
  invite_id: string | undefined,
  status: string | undefined,
) {
  if (!status) throw new AppError('MISSING_STATUS')
  if (!invite_id) throw new AppError('MISSING_INVITE_ID')

  const validStatuses = ['ACCEPTED', 'REJECTED', 'REVOKED']
  if (!validStatuses.includes(status))
    throw new AppError('INVALID_STATUS_VALUE')

  const current = await getInvitation(invite_id)
  if (!current) throw new AppError('INVITATION_NOT_FOUND')

  if (current.status !== 'PENDING') throw new AppError('INVITATION_NOT_PENDING')

  // For each possible status update, does the token user have the correct role
  if (status === 'REVOKED' && user.sub !== current.sender_id) {
    if (!(await isProjectOwner(current.project_id, user.sub)))
      throw new AppError('UNAUTHORIZED_REQUEST')
  } else if (
    (status === 'ACCEPTED' || status === 'REJECTED') &&
    user.sub !== current.receiver_id
  )
    throw new AppError('UNAUTHORIZED_REQUEST')
}

export { validateInvitePost, validateInviteGet, validateInvitePatch }

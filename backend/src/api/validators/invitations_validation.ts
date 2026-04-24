import { getProject } from '../../db/services/project.services.js'
import { getUser } from '../../db/services/userServices.js'
import { AppError } from '../errors/AppError.js'

async function validateInvitePost(
  sender_id: string,
  receiver_id: string,
  project_id: string,
) {
  if (sender_id) {
    const sender = await getUser(sender_id)
    if (!sender) throw new AppError('SENDER_NOT_FOUND')
  } else throw new AppError('MISSING_SENDER_ID')

  if (receiver_id) {
    const receiver = await getUser(receiver_id)
    if (!receiver) throw new AppError('RECEIVER_NOT_FOUND')
  } else throw new AppError('MISSING_RECEIVER_ID')

  const project = await getProject(project_id)
  if (!project) throw new AppError('PROJECT_NOT_FOUND')
}

async function validateInviteGet(project_id: string, receiver_id: string) {
  if (project_id && receiver_id) throw new AppError('TOO_MANY_PARAMETERS')

  if (project_id && typeof project_id === 'string') {
    const project = await getProject(project_id)
    if (!project) throw new AppError('PROJECT_NOT_FOUND')
  } else if (receiver_id && typeof receiver_id === 'string') {
    const receiver = await getUser(receiver_id)
    if (!receiver) throw new AppError('USER_NOT_FOUND')
  } else throw new AppError('MISSING_SEARCH_PARAMETER')
}

export { validateInvitePost, validateInviteGet }

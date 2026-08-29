import type { Request, Response, NextFunction, RequestHandler } from 'express'
import {
  getContributor,
  getProject,
} from '../../db/services/project.services.js'
import { AppError } from '../errors/AppError.js'
import { getIssue } from '../../db/services/issueServices.js'
import { getComment } from '../../db/services/commentServices.js'
import { getProfile } from '../../db/services/userServices.js'
import { getInvite } from '../../db/services/inviteServices.js'

type KeyGetter<K> = (req: Request, res: Response) => K

function loadResource<K, T>(
  getKey: KeyGetter<K>,
  getByKey: (key: K) => Promise<T | null>,
  resourceType: string,
  AppErrorCode: string,
  required: boolean = true,
): RequestHandler {
  return async (req, res, next) => {
    const resource = await getByKey(getKey(req, res))

    if (resource) {
      res.locals[resourceType] = resource
      return next()
    }

    if (required) {
      return next(new AppError(AppErrorCode))
    }

    next()
  }
}

export const loadInvite = (getKey: KeyGetter<string>) =>
  loadResource(getKey, getInvite, 'invite', 'INVITE_NOT_FOUND')

export const loadComment = (getKey: KeyGetter<string>) =>
  loadResource(getKey, getComment, 'comment', 'COMMENT_NOT_FOUND')

export const loadIssue = (getKey: KeyGetter<string>) =>
  loadResource(getKey, getIssue, 'issue', 'ISSUE_NOT_FOUND')

export const loadProject = (getKey: KeyGetter<string>) =>
  loadResource(getKey, getProject, 'project', 'PROJECT_NOT_FOUND')

export const loadContributor = (
  getKey: KeyGetter<{ project_id: string; user_id: string }>,
) =>
  loadResource(
    getKey,
    ({ project_id, user_id }) => getContributor(project_id, user_id),
    'contributor',
    'NONE_REQUIRED',
    false,
  )

export const loadProfile = (getKey: KeyGetter<string>) =>
  loadResource(getKey, getProfile, 'profile', 'PROFILE_NOT_FOUND')

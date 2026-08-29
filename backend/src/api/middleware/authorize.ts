import type { Request, Response, RequestHandler } from 'express'
import { AppError } from '../errors/AppError.js'
import { getComment } from '../../db/services/commentServices.js'
import { getIssue } from '../../db/services/issueServices.js'

/*
With the exception of 
isProjectMember/res.locals.contributor ( loadContributor(required: false) ),
all authorization checks require relevant data to have been correctly loaded 
onto res.locals via middleware from loadRequest.ts
*/

type Rule = (req: Request, res: Response) => boolean

export const isProjectCreator: Rule = (req, res) => {
  return req.user?.sub === res.locals.project?.creator_id
}

export const isProjectMember: Rule = (req, res) => {
  return isProjectCreator(req, res) || res.locals.contributor
}

export const isIssueCreator: Rule = (req, res) => {
  return req.user?.sub === res.locals.issue.creator_id
}

export const isCommentCreator: Rule = (req, res) => {
  return req.user?.sub === res.locals.comment.creator_id
}

export const isAssignee: Rule = (req, res) => {
  return req.user?.sub === res.locals.issue.assignee_id
}

export const isSender: Rule = (req, res) => {
  return req.user?.sub === res.locals.invite.sender_id
}

export const anyOf =
  (...rules: Rule[]): Rule =>
  (req, res) => {
    for (const rule of rules) {
      if (rule(req, res)) return true
    }
    return false
  }

export const allOf =
  (...rules: Rule[]): Rule =>
  (req, res) => {
    for (const rule of rules) {
      if (!rule(req, res)) return false
    }
    return true
  }

export const requireRule =
  (rule: Rule): RequestHandler =>
  async (req, res, next) => {
    try {
      if (await rule(req, res)) return next()
      next(new AppError('UNAUTHORIZED_REQUEST'))
    } catch (err) {
      next(err)
    }
  }

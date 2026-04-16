import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'

function validateUserPost(req: Request) {
  if (!req.body || !req.body.username) {
    throw new AppError('MISSING_USERNAME')
  }
}

function validateUserPatch(req: Request) {
  if (!req.body || !req.body.username) {
    throw new AppError('MISSING_USERNAME')
  }
}

export { validateUserPost, validateUserPatch }

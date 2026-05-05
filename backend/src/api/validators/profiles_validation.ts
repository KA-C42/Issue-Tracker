import type { Request } from 'express'
import { AppError } from '../errors/AppError.js'

function validateProfilePost(req: Request) {
  if (!req.body || !req.body.username) {
    throw new AppError('MISSING_USERNAME')
  }
}

function validateProfilePatch(req: Request) {
  if (!req.body || !req.body.username) {
    throw new AppError('MISSING_USERNAME')
  }
}

export { validateProfilePost, validateProfilePatch }

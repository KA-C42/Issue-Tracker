import 'dotenv/config'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'

const authenticateUser: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return next(new AppError('MISSING_TOKEN'))
  }

  const secret = process.env.SUPABASE_AUTH_SECRET
  if (!secret) throw new Error('Missing JWT secret')

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return next(new AppError('INVALID_TOKEN'))
    }

    ;(req as AuthenticatedRequest).user = user as JwtUser

    next()
  })
}

export { authenticateUser }

import 'dotenv/config'
import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import type {
  AuthenticatedRequest,
  JwtUser,
} from '../../types/authenticatedRequest.js'

const authenticateUser: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const secret = process.env.SUPABASE_AUTH_SECRET
  if (!secret) throw new Error('Missing JWT secret')

  jwt.verify(token as string, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }

    ;(req as AuthenticatedRequest).user = user as JwtUser

    next()
  })
}

export { authenticateUser }

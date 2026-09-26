import 'dotenv/config'
import type { RequestHandler } from 'express'
import type { JwtUser } from '../../types/authenticatedRequest.js'
import { AppError } from '../errors/AppError.js'
import * as jose from 'jose'

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | undefined

const authenticateUser: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return next(new AppError('MISSING_TOKEN'))
  }

  const AUTH_URL = process.env.SUPABASE_AUTH_URL
  if (!AUTH_URL) throw new Error('Missing jwt key url')

  jwks ??= jose.createRemoteJWKSet(new URL(AUTH_URL))

  try {
    const { payload } = await jose.jwtVerify(token, jwks)
    req.user = payload as JwtUser
    next()
  } catch {
    return next(new AppError('INVALID_TOKEN'))
  }
}

export { authenticateUser }

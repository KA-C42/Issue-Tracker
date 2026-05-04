import type { Request } from 'express'
import type { JwtPayload } from 'jsonwebtoken'

export interface JwtUser extends JwtPayload {
  sub: string
  email: string
  session_id: string
  iss: string
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser
}

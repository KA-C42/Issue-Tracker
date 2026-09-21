import type { JwtPayload } from 'jsonwebtoken'

export interface JwtUser extends JwtPayload {
  sub: string
  session_id: string
  iss: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser
    }
  }
}

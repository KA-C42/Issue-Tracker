import jwt from 'jsonwebtoken'

export function createAuthToken(uuid: string) {
  const auth_key = process.env.SUPABASE_AUTH_SECRET
  if (!auth_key) throw new Error('Missing supabase auth key')

  const token = jwt.sign({ sub: uuid }, auth_key)

  return token
}

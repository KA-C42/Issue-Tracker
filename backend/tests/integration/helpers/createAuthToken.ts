// helpers/auth.ts
import * as jose from 'jose'

let privateKey: CryptoKey
let localJwks: () => Promise<CryptoKey>

export function getTestJwks() {
  return localJwks
}

//
export async function setupTestKeys() {
  const keySet = await jose.generateKeyPair('RS256')
  privateKey = keySet.privateKey
  const publicJwk = await jose.exportJWK(keySet.publicKey)
  localJwks = jose.createLocalJWKSet({ keys: [{ ...publicJwk, kid: 'test' }] })
}

export async function createAuthToken(
  userId: string,
  expiresIn: string | number = '1h',
) {
  const jwt = new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey)

  return jwt
}

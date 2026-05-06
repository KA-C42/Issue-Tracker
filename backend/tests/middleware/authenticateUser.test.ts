import { Application } from 'express'
import { beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { User } from '../../src/types/db'
import createApp from '../../src/api/app'
import { createTestUser } from '../integration/helpers/createTestRows'
import { createAuthToken } from '../integration/helpers/createAuthToken'
import jwt from 'jsonwebtoken'

// tests for middleware need to go through a route. Choosing simple GET profile
describe('authenticateUser middleware function', () => {
  let app: Application
  let user: User
  let token: string
  const email = 'spootyToot@hotmail.fake'

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(email)
    token = createAuthToken(user.id)
  })

  it('Succeeds with a valid jwt', async () => {
    await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('fails when lacking a jwt', async () => {
    await request(app).get(`/profiles/${user.id}`).expect(401)
  })

  it('fails when using a modified jwt', async () => {
    const tamperedToken = jwt.sign(
      { sub: user.id, email: user.email },
      'wrong-secret',
    )

    await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(403)
  })

  it('fails when using an expired jwt', async () => {
    const secret = process.env.SUPABASE_AUTH_SECRET
    if (!secret) throw new Error('Missing auth secret')

    const expiredToken = jwt.sign({ sub: user.id, email: email }, secret, {
      expiresIn: -1,
    })

    await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(403)
  })
})

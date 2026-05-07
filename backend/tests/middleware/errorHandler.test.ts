import { describe, it, expect } from 'vitest'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import { createTestUser } from '../integration/helpers/createTestRows.js'
import { createAuthToken } from '../integration/helpers/createAuthToken.js'

describe('error middleware', () => {
  it('returns a 404 not found error for a request to unknown route /mcRoutey', async () => {
    const app = createApp()
    const user = await createTestUser()
    const token = createAuthToken(user.id)

    const response = await request(app)
      .post('/mcRoutey')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
  })
})

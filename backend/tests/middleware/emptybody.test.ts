import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import createApp from '../../src/api/app.js'
import { createTestUser } from '../integration/helpers/createTestRows.js'
import { createAuthToken } from '../integration/helpers/createAuthToken.js'

describe('empty body middleware', () => {
  it('treats a request with no body as {}, so validation returns 400 instead of crashing', async () => {
    const app = createApp()
    const user = await createTestUser()
    const token = await createAuthToken(user.id)

    // no .send(): no body and no Content-Type, so express.json() leaves req.body undefined
    const response = await request(app)
      .patch(`/issues/${randomUUID()}/status`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})

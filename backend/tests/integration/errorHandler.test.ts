import { describe, it, expect } from 'vitest'
import request from 'supertest'
import createApp from '../../src/api/app.js'

describe('error middleware', () => {
  it('returns a 404 not found error for a request to unknown route /mcRoutey', async () => {
    const app = createApp()

    const response = await request(app)
      .post('/mcRoutey')
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
  })
})

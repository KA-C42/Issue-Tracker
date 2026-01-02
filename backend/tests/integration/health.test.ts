import { describe, it } from 'vitest'
import request from 'supertest'
import createApp from '../../src/api/app.js'

describe('GET /health', () => {
  it('returns 200 status with positive connection status', async () => {
    const app = createApp()

    await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        connection: "just fine n' dandy",
      })
  })
})

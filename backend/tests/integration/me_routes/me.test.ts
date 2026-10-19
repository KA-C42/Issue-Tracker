import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import { createTestUser } from '../helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from '../helpers/createAuthToken.js'
import { User } from '@issue-tracker/shared'

describe('/me profile routes', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
  })

  it('GET retrieves a profile by session user id with status 200', async () => {
    const result = await request(app)
      .get(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.id).toBe(user.id)
  })

  it('PATCH updates username by session user id with status 201', async () => {
    const result = await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'wetHands' })
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.username).toBe('wetHands')
  })

  it('PATCH returns 409 when provided with a username already in use', async () => {
    const newUser = await createTestUser('b@b.b')
    const newToken = await createAuthToken(newUser.id)

    const username = 'user'
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: username })
      .expect(200)
      .expect('Content-Type', /json/)

    const result = await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${newToken}`)
      .send({ username: username })
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('USERNAME_CONFLICT')
  })

  it('PATCH returns 400 when provided with an invalid username', async () => {
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username:
          "Oh my, what a long username you have there. Sure would be a shame if something.... DIDN'T happen to it, huh? Sure would be a shame if it just... didn't save. Would be truly awful to have to type allllllll of that in again, so be reeeeaeaaaaaaaallll careful and maybe what you want to happen to it, actually might happen to it. You never know ;).exe",
      })
      .expect(400)
      .expect('Content-Type', /json/)
  })

  it('PATCH returns 400 when provided with a blank username', async () => {
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: '',
      })
      .expect(400)
      .expect('Content-Type', /json/)
  })

  it('DELETE soft deletes a user by setting the deactivated_at field with status 200', async () => {
    const deleted = await request(app)
      .delete(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(deleted.body.deactivated_at).toBeTruthy()
  })
})

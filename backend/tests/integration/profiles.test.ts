import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import { createTestUser, setUsername } from './helpers/createTestRows.js'
import { getProfile } from '../../src/db/services/userServices.js'
import { createAuthToken } from './helpers/createAuthToken.js'
import { Application } from 'express'
import { User } from '../../src/types/db.js'

describe('GET /profiles', () => {
  let app: Application
  let user: User
  let token: string
  const username = 'testMe'

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)

    await setUsername(app, user.id, username, token)
  })

  it('retrieves a user row by id with status 200', async () => {
    const response = await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      id: user.id,
      username: username,
    })
  })

  it('rejects a request for nonexistent user with status 404', async () => {
    const response = await request(app)
      .get(`/profiles/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('allows a user to retrieve a different profile than their own', async () => {
    const newUser = await createTestUser('other@m.m')
    const newToken = createAuthToken(newUser.id)

    const response = await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      id: user.id,
      username: username,
    })
  })
})

// only changeable field is username
describe('PATCH /profiles', () => {
  let app: Application
  let user: User
  let oldUsername: string
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    oldUsername = (await getProfile(user.id)).username
    token = createAuthToken(user.id)
  })

  it('successfully changes a users username with status 200', async () => {
    const payload = {
      username: 'kacy',
    }

    const response = await request(app)
      .patch(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      ...payload,
      id: user.id,
    })
    expect(response.body.username).not.toBe(oldUsername)
  })

  it('rejects a request with mistmatched id and token id with status 403', async () => {
    const newUser = await createTestUser('other@users.email')

    const payload = {
      username: 'nullUser',
    }

    const response = await request(app)
      .patch(`/profiles/${newUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('rejects a request when the username is already in use with status 409', async () => {
    const newUser = await createTestUser('other@users.email')
    const newToken = createAuthToken(newUser.id)

    const payload = {
      username: oldUsername,
    }

    const response = await request(app)
      .patch(`/profiles/${newUser.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USERNAME_CONFLICT')
  })
})

describe('DELETE /profiles', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
  })

  it('soft deletes a user by setting the deactivated_at field with status 200', async () => {
    const deleted = await request(app)
      .delete(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(deleted.body.deactivated_at).toBeTruthy()
  })

  it('rejects a request with mistmatched id and token id with status 403', async () => {
    const newUser = await createTestUser('fake@email.blah')

    const response = await request(app)
      .delete(`/profiles/${newUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

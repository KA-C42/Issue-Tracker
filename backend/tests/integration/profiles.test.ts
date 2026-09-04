import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import { createTestUser, setUsername } from './helpers/createTestRows.js'
import { createAuthToken } from './helpers/createAuthToken.js'
import { Application } from 'express'
import { Profile, User } from '@issue-tracker/shared'

describe('GET /profiles/:id', () => {
  let app: Application
  let user: User
  let token: string
  const username = 'testMe'

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)

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
    const newToken = await createAuthToken(newUser.id)

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

describe('GET /profiles?user', () => {
  let app: Application
  let user: User
  let token: string
  let otherUser: User
  let otherToken: string
  const username = 'nameyName'
  const email = 'test@issue.tracker'
  let otherProfile: Profile

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
    otherUser = await createTestUser(email)
    otherToken = await createAuthToken(otherUser.id)
    otherProfile = await setUsername(app, otherUser.id, username, otherToken)
  })

  it("returns another user's profile by username", async () => {
    const result = await request(app)
      .get(`/profiles?user=${username}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject(otherProfile)
  })

  it('returns 404 when user not found by username', async () => {
    const result = await request(app)
      .get(`/profiles?user=${'4040404'}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('returns 400 when user query not provided', async () => {
    const result = await request(app)
      .get(`/profiles`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })
})

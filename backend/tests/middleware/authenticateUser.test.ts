import { Application } from 'express'
import { beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { Project, User } from '../../src/types/db'
import createApp from '../../src/api/app'
import {
  createInvitation,
  createTestComment,
  createTestIssue,
  createTestProject,
  createTestUser,
} from '../integration/helpers/createTestRows'
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
    token = await createAuthToken(user.id)
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
    const expiredToken = await createAuthToken(
      user.id,
      '-1h', // expired time
    )

    await request(app)
      .get(`/profiles/${user.id}`)
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(403)
  })
})

describe('auth protected routes hit auth first', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
  })

  it('returns 401 if request a profile without auth provided', async () => {
    await request(app)
      .get(`/profiles/${user.id}`)
      .expect(401)
      .expect('Content-Type', /json/)
  })

  beforeEach(async () => {
    token = await createAuthToken(user.id)
    project = await createTestProject(app, token)
  })

  it('returns 401 if request a project without auth provided', async () => {
    await request(app)
      .get(`/projects/${project.id}`)
      .expect(401)
      .expect('Content-Type', /json/)
  })

  it('returns 401 if request a contributor without auth provided', async () => {
    await request(app)
      .get(`/projects/${project.id}/contributors`)
      .expect(401)
      .expect('Content-Type', /json/)
  })

  it('returns 401 if request an issue without auth provided', async () => {
    const issue = await createTestIssue(app, token, project.id)

    await request(app)
      .get(`/issues/${issue.id}`)
      .expect(401)
      .expect('Content-Type', /json/)
  })

  it('returns 401 if request a comment without auth provided', async () => {
    const issue = await createTestIssue(app, token, project.id)
    await createTestComment(app, token, issue.id)

    await request(app)
      .get(`/issues/${issue.id}/comments`)
      .expect(401)
      .expect('Content-Type', /json/)
  })

  it('returns 401 if request an invitation without auth provided', async () => {
    const invitee = await createTestUser('new@m.m')
    await createInvitation(app, token, invitee.id, project.id)

    await request(app)
      .get(`/invitations?receiver_id=${invitee.id}`)
      .expect(401)
      .expect('Content-Type', /json/)
  })
})

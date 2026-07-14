import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { Project, User } from '../../../src/types/db.js'
import { createAuthToken } from '../helpers/createAuthToken.js'

describe('POST invitations', () => {
  let app: Application
  let owner: User
  let token: string
  let project: Project
  let invitee: User

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser()
    token = await createAuthToken(owner.id)
    project = await createTestProject(app, token)
    invitee = await createTestUser('invite@me.please')
  })

  it('creates a new invitation, returning 201', async () => {
    const payload = {
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      id: expect.any(String),
      project_id: project.id,
      status: 'PENDING',
      status_changed_at: expect.any(String),
      sent_at: expect.any(String),
    })
  })

  it('returns 404 when receiver_id not found', async () => {
    const payload = {
      receiver_id: crypto.randomUUID(),
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECEIVER_NOT_FOUND')
  })

  it('returns 404 when project_id not found', async () => {
    const payload = {
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${crypto.randomUUID()}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 400 when receiver_id not provided', async () => {
    const payload = {}

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_RECEIVER_ID')
  })

  it('returns 409 when a duplicate pending invite already exists', async () => {
    const payload = {
      receiver_id: invitee.id,
    }

    await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITE_ALREADY_PENDING')
  })

  it('allows invite when a duplicate exists but is not pending', async () => {
    const payload = {
      receiver_id: invitee.id,
    }

    const response = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const invite = response.body

    await request(app)
      .patch(`/invitations/${invite.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REVOKED' })
      .expect(200)

    await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)
  })

  it('returns 409 when user is already a contributor to the project', async () => {
    const contributor = await makeContributor(invitee.id, project.id)

    const payload = {
      receiver_id: contributor.user_id,
    }

    const result = await request(app)
      .post(`/projects/${contributor.project_id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECIPIENT_ALREADY_CONTRIBUTOR')
  })

  it('returns 409 when user is the project owner', async () => {
    await makeContributor(invitee.id, project.id)

    const payload = {
      receiver_id: owner.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECIPIENT_OWNS_PROJECT')
  })

  it('returns 403 when token id/sender is not project member', async () => {
    const newUser = await createTestUser('s@d.d')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

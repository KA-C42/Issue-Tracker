import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createInvitation,
  createTestUser,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { Invitation, Project, User } from '../../../src/types/db.js'
import { createAuthToken } from '../helpers/createAuthToken.js'

describe('PATCH invitations', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project
  let invitee: User
  let inviteeToken: string
  let invitation: Invitation

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser('owner@m.m')
    ownerToken = createAuthToken(owner.id)
    project = await createTestProject(app, ownerToken, 'project')
    invitee = await createTestUser('invitee@m.m')
    inviteeToken = createAuthToken(invitee.id)
    invitation = await createInvitation(app, ownerToken, invitee.id, project.id)
  })

  it('returns 400 if the new status is invalid (none of "PENDING" "REJECTED" "REVOKED" "ACCEPTED"', async () => {
    const payload = {
      status: 'heck to the yeah homie',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_STATUS_VALUE')
  })

  it('returns 403 if the invitee tries to change status to "REVOKED"', async () => {
    const payload = {
      status: 'REVOKED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 if the sender tries to change status to "ACCEPTED"', async () => {
    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 if the sender tries to change status to "REJECTED"', async () => {
    const payload = {
      status: 'REJECTED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 if an unrelated user attempts a patch', async () => {
    const newUser = await createTestUser('mess@you.up')
    const newToken = createAuthToken(newUser.id)

    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it("creates a project_contributor row on invitee PATCH to status='ACCEPTED", async () => {
    // no project contributors yet
    const existingContributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('AUTHORIZATION', `Bearer ${ownerToken}`)
      .expect(200)

    expect(existingContributors.body).toStrictEqual([])

    const payload = {
      status: 'ACCEPTED',
    }
    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invitation.id,
      status: payload.status,
    })

    // ensure project contributor row creation
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(200)

    expect(contributors.body).toMatchObject([
      {
        user_id: invitee.id,
        project_id: project.id,
        joined_at: expect.any(String),
      },
    ])
  })

  it('returns the updated row and does not create a project_contributor row when status PATCH != ACCEPTED', async () => {
    const payload = {
      status: 'REJECTED',
    }
    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invitation.id,
      status: payload.status,
    })

    // ensure project contributor row not created
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(contributors.body).toMatchObject([])
  })

  it('returns 400 when attempting to PATCH status to PENDING', async () => {
    const payload = {
      status: 'PENDING',
    }
    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_STATUS_VALUE')
  })

  it('returns 409 when the invite has already been patched and is no longer PENDING', async () => {
    await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ status: 'REJECTED' })
      .expect(200)

    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITATION_NOT_PENDING')
  })

  it('returns 400 when lacking status field', async () => {
    const payload = {}

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_STATUS')
  })

  it('returns 404 when invite id not found', async () => {
    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invitations/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITATION_NOT_FOUND')
  })
})

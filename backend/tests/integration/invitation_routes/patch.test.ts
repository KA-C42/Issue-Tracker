import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createInvite,
  createTestUser,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { Invite, Project, User } from '../../../src/types/db.js'
import { createAuthToken } from '../helpers/createAuthToken.js'

/*

/invites/:id is for revoking only, as it is only accessible
to the project creator and invite sender.
See ../me.test.ts for PATCH /me/invites/:id with 'ACCEPTED' or 'REJECTED'

*/
describe('PATCH /invites/:id', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project
  let invitee: User
  let inviteeToken: string
  let invite: Invite

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser('owner@m.m')
    ownerToken = await createAuthToken(owner.id)
    project = await createTestProject(app, ownerToken, 'project')
    invitee = await createTestUser('invitee@m.m')
    inviteeToken = await createAuthToken(invitee.id)
    invite = await createInvite(app, ownerToken, invitee.id, project.id)
  })

  it('returns 400 if the new status is not "REVOKED"', async () => {
    const payload = {
      status: 'heck to the yeah homie',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 if the invitee tries to change status to "REVOKED"', async () => {
    const payload = {
      status: 'REVOKED',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 400 if the sender tries to change status to "ACCEPTED"', async () => {
    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 if the sender tries to change status to "REJECTED"', async () => {
    const payload = {
      status: 'REJECTED',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 403 if an unrelated user attempts a patch', async () => {
    const newUser = await createTestUser('mess@you.up')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      status: 'REVOKED',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 400 when attempting to PATCH status to PENDING', async () => {
    const payload = {
      status: 'PENDING',
    }
    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when the invite has already been patched and is no longer PENDING', async () => {
    await request(app)
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ status: 'REJECTED' })
      .expect(200)

    const payload = {
      status: 'REVOKED',
    }

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITE_NOT_PENDING')
  })

  it('returns 400 when lacking status field', async () => {
    const payload = {}

    const result = await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when invite id not found', async () => {
    const payload = {
      status: 'REVOKED',
    }

    const result = await request(app)
      .patch(`/invites/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    console.log(JSON.stringify(result.body))

    expect(result.body.error.code).toBe('INVITE_NOT_FOUND')
  })
})

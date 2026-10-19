import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  createInvite,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from '../helpers/createAuthToken.js'
import { Project, User, Invite } from '@issue-tracker/shared'

describe('GET /me/invites', () => {
  let app: Application
  let sender: User
  let senderToken: string
  let recipient: User
  let recipientToken: string

  beforeEach(async () => {
    app = createApp()
    sender = await createTestUser('sender@m.m')
    senderToken = await createAuthToken(sender.id)
    recipient = await createTestUser('recipient@m.m')
    recipientToken = await createAuthToken(recipient.id)
  })

  it('returns pending invites newest first, with sender username and project title', async () => {
    const projectA = await createTestProject(app, senderToken, 'project A')
    const projectB = await createTestProject(app, senderToken, 'project B')
    const olderInvite = await createInvite(
      app,
      senderToken,
      recipient.id,
      projectA.id,
    )
    const newerInvite = await createInvite(
      app,
      senderToken,
      recipient.id,
      projectB.id,
    )

    const { body: senderProfile } = await request(app)
      .get('/me/profile')
      .set('Authorization', `Bearer ${senderToken}`)
      .expect(200)

    const result = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${recipientToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toEqual([
      {
        ...newerInvite,
        sender_username: senderProfile.username,
        project_title: projectB.title,
      },
      {
        ...olderInvite,
        sender_username: senderProfile.username,
        project_title: projectA.title,
      },
    ])
  })

  it('excludes invites sent to other users', async () => {
    const otherUser = await createTestUser('other@m.m')
    const project = await createTestProject(app, senderToken)
    const recipientInvite = await createInvite(
      app,
      senderToken,
      recipient.id,
      project.id,
    )
    await createInvite(app, senderToken, otherUser.id, project.id)

    const result = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${recipientToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(1)
    expect(result.body[0].id).toBe(recipientInvite.id)
  })

  it('excludes invites that are no longer pending', async () => {
    const pendingProject = await createTestProject(app, senderToken, 'pending')
    const pendingInvite = await createInvite(
      app,
      senderToken,
      recipient.id,
      pendingProject.id,
    )

    // one project per status so the invites don't collide
    for (const status of ['ACCEPTED', 'REJECTED', 'REVOKED'] as const) {
      const project = await createTestProject(app, senderToken, status)
      await createInvite(app, senderToken, recipient.id, project.id, status)
    }

    const result = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${recipientToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(1)
    expect(result.body[0].id).toBe(pendingInvite.id)
  })

  it('returns an empty array when the recipient has no invites', async () => {
    const result = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${recipientToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })
})

describe('PATCH /me/invites/:id', () => {
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
  it("creates a project_contributor row on invitee PATCH to status='ACCEPTED", async () => {
    // no project contributors yet
    const existingContributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('AUTHORIZATION', `Bearer ${ownerToken}`)
      .expect(200)

    expect(existingContributors.body).toContainEqual(
      expect.objectContaining({ user_id: owner.id, project_id: project.id }),
    )

    const ownerRow = existingContributors.body[0]

    const payload = {
      status: 'ACCEPTED',
    }
    const result = await request(app)
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invite.id,
      status: payload.status,
    })

    // ensure project contributor row creation
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(200)

    expect(contributors.body).toMatchObject([
      ownerRow,
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
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invite.id,
      status: payload.status,
    })

    // ensure no NEW contributor row was created — only the owner's own row is there
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(contributors.body).toHaveLength(1)
    expect(contributors.body).toContainEqual(
      expect.objectContaining({ user_id: owner.id, project_id: project.id }),
    )
  })

  it('returns 409 and creates no contributor row when accepting a revoked invite', async () => {
    await request(app)
      .patch(`/invites/${invite.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'REVOKED' })
      .expect(200)

    const result = await request(app)
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(409)

    expect(result.body.error.code).toBe('INVITE_NOT_PENDING')

    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(contributors.body).toHaveLength(1)
  })

  it('lets only one of a simultaneous accept and revoke succeed', async () => {
    const [accept, revoke] = await Promise.all([
      request(app)
        .patch(`/me/invites/${invite.id}`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ status: 'ACCEPTED' }),
      request(app)
        .patch(`/invites/${invite.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'REVOKED' }),
    ])

    expect([accept.status, revoke.status].sort((a, b) => a - b)).toEqual([
      200, 409,
    ])

    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    // the invitee joined only if the accept won
    expect(contributors.body).toHaveLength(accept.status === 200 ? 2 : 1)
  })
})

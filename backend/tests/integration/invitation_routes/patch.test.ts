import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  createInvitation,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { Invitation, Project, User } from '../../../src/db/types/db.js'

describe('PATCH invitations', () => {
  let app: Application
  let owner: User
  let project: Project
  let invitee: User
  let invitation: Invitation

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser(app, 'owner')
    project = await createTestProject(app, owner.id, 'project')
    invitee = await createTestUser(app, 'invitee')
    invitation = await createInvitation(app, owner.id, invitee.id, project.id)
  })

  it("returns the updated row and creates a project_contributor row on PATCH to status='ACCEPTED", async () => {
    // no project contributors yet
    const existingContributors = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
      .expect(200)

    expect(existingContributors.body).toStrictEqual([])

    const payload = {
      status: 'ACCEPTED',
    }
    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invitation.id,
      status: payload.status,
    })

    // ensure project contributor row creation
    const contributors = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
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
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invitation.id,
      status: payload.status,
    })

    // ensure project contributor row not created
    const contributors = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
      .expect(200)

    expect(contributors.body).toMatchObject([])
  })

  it('returns 400 when attempting to PATCH status PENDING to PENDING', async () => {
    const payload = {
      status: 'PENDING',
    }
    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_STATUS_CHANGE')
  })

  it('returns 400 when attempting to PATCH an invitation status that is not PENDING', async () => {
    await request(app)
      .patch(`/invitations/${invitation.id}`)
      .send({ status: 'REJECTED' })
      .expect(200)

    const payload = {
      status: 'ACCEPTED',
    }

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_STATUS_CHANGE')
  })

  it('returns 400 when lacking status field', async () => {
    const payload = {}

    const result = await request(app)
      .patch(`/invitations/${invitation.id}`)
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
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITATION_NOT_FOUND')
  })
})

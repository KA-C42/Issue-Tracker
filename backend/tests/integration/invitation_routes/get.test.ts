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
import { Invite, Project, User } from '@issue-tracker/shared'
import { createAuthToken } from '../helpers/createAuthToken.js'

describe('GET /projects/:project_id/invites', () => {
  let app: Application
  let owner: User
  let token: string
  let projects: Project[]
  let invitees: User[]
  let invites: Invite[]

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser()
    token = await createAuthToken(owner.id)
    projects = [
      await createTestProject(app, token, 'project 1'),
      await createTestProject(app, token, 'project 2'),
    ]
    invitees = [
      await createTestUser('user1@O.O'),
      await createTestUser('user2@u.u'),
    ]
    // reference for which invites are expected in return
    invites = [
      await createInvite(app, token, invitees[0].id, projects[0].id),
      await createInvite(app, token, invitees[1].id, projects[0].id),

      await createInvite(app, token, invitees[0].id, projects[1].id),
      await createInvite(app, token, invitees[1].id, projects[1].id),
    ]
  })

  it('returns pending invites with usernames by project_id', async () => {
    const result = await request(app)
      .get(`/projects/${projects[0].id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const withUsernames = (invite: Invite) =>
      expect.objectContaining({
        ...invite,
        sender_username: expect.any(String),
        recipient_username: expect.any(String),
      })

    expect(result.body).toHaveLength(2)
    expect(result.body).toEqual(
      expect.arrayContaining([
        withUsernames(invites[0]),
        withUsernames(invites[1]),
      ]),
    )
  })

  it('excludes invites that are no longer pending', async () => {
    await request(app)
      .patch(`/invites/${invites[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'REVOKED' })
      .expect(200)

    const result = await request(app)
      .get(`/projects/${projects[0].id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(1)
    expect(result.body[0].id).toBe(invites[1].id)
  })

  it('returns empty array by project_id if no results', async () => {
    const newProject = await createTestProject(app, token, 'newP')

    const result = await request(app)
      .get(`/projects/${newProject.id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })

  it('returns 404 when project_id not found', async () => {
    const result = await request(app)
      .get(`/projects/${crypto.randomUUID()}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 403 when by project_id and token id not project member', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/projects/${projects[0].id}/invites`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

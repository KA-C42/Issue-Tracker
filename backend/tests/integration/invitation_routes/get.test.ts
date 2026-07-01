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

describe('GET invitations', () => {
  let app: Application
  let token: string
  let projects: Project[]
  let invitees: { user: User; token: string }[]
  let invitations: Invitation[]

  beforeEach(async () => {
    app = createApp()
    ;({ token } = await createTestUser())
    projects = [
      await createTestProject(app, token, 'project 1'),
      await createTestProject(app, token, 'project 2'),
    ]
    invitees = [
      await createTestUser('user1@O.O'),
      await createTestUser('user2@u.u'),
    ]
    // reference for which invitations are expected in return
    invitations = [
      await createInvitation(app, token, invitees[0].user.id, projects[0].id),
      await createInvitation(app, token, invitees[1].user.id, projects[0].id),

      await createInvitation(app, token, invitees[0].user.id, projects[1].id),
      await createInvitation(app, token, invitees[1].user.id, projects[1].id),
    ]
  })

  it('returns all by project_id', async () => {
    const result = await request(app)
      .get(`/invitations?project_id=${projects[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(2)
    expect(result.body).toEqual(
      expect.arrayContaining([invitations[0], invitations[1]]),
    )
    expect(result.body).not.toEqual(expect.arrayContaining([invitations[2]]))
    expect(result.body).not.toEqual(expect.arrayContaining([invitations[3]]))
  })

  it('returns all by receiver_id', async () => {
    const searchId = invitees[0].user.id

    const result = await request(app)
      .get(`/invitations?receiver_id=${searchId}`)
      .set('Authorization', `Bearer ${invitees[0].token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(2)
    expect(result.body).toEqual(
      expect.arrayContaining([invitations[0], invitations[2]]),
    )
    expect(result.body).not.toEqual(expect.arrayContaining([invitations[1]]))
    expect(result.body).not.toEqual(expect.arrayContaining([invitations[3]]))
  })

  it('returns empty array by project_id if no results', async () => {
    const newProject = await createTestProject(app, token, 'newP')

    const result = await request(app)
      .get(`/invitations?project_id=${newProject.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })

  it('returns empty array by receiver_id if no results', async () => {
    const { user: newUser, token: newToken } = await createTestUser('new@o.o')

    const result = await request(app)
      .get(`/invitations?receiver_id=${newUser.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })

  it('returns 404 when project_id not found', async () => {
    const result = await request(app)
      .get(`/invitations?project_id=${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 400 when lacking a search parameter', async () => {
    const result = await request(app)
      .get(`/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('returns 400 when provided with both project_id and receiver_id', async () => {
    const result = await request(app)
      .get(
        `/invitations?project_id=${projects[0].id}&receiver_id=${invitees[0].user.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('TOO_MANY_PARAMETERS')
  })

  it('returns 403 when by project_id and token id not project member', async () => {
    const { token: newToken } = await createTestUser('m@m.m')

    const result = await request(app)
      .get(`/invitations?project_id=${projects[0].id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 when by receiver_id and token id is different', async () => {
    const { token: newToken } = await createTestUser('m@m.m')

    const result = await request(app)
      .get(`/invitations?receiver_id=${invitees[0].user.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

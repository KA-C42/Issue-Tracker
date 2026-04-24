import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  makeContributor,
  createInvitation,
} from './helpers/createTestRows.js'
import { Application } from 'express'
import { Invitation, Project, User } from '../../src/db/types/db.js'

describe('POST invitations', () => {
  let app: Application
  let owner: User
  let project: Project
  let invitee: User

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser(app, 'owner')
    project = await createTestProject(app, owner.id)
    invitee = await createTestUser(app, 'invitee')
  })

  it('creates a new invitation, returning 200', async () => {
    const payload = {
      sender_id: owner.id,
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
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

  it('returns 404 when sender_id not found', async () => {
    const payload = {
      sender_id: crypto.randomUUID(),
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('SENDER_NOT_FOUND')
  })

  it('returns 404 when receiver_id not found', async () => {
    const payload = {
      sender_id: owner.id,
      receiver_id: crypto.randomUUID(),
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECEIVER_NOT_FOUND')
  })

  it('returns 404 when project_id not found', async () => {
    const payload = {
      sender_id: owner.id,
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${crypto.randomUUID()}/invitations`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 400 when sender_id not provided', async () => {
    const payload = {
      sender_id: null,
      receiver_id: invitee.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SENDER_ID')
  })

  it('returns 400 when receiver_id not provided', async () => {
    const payload = {
      sender_id: owner.id,
      receiver_id: null,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_RECEIVER_ID')
  })

  // TODO all below
  it('returns 409 when a duplicate pending invite already exists', async () => {
    const payload = {
      sender_id: owner.id,
      receiver_id: invitee.id,
    }

    await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVITE_ALREADY_PENDING')
  })

  // TODO once patch is ready it('allows invite when a duplicate exists but is not pending', async () => {})

  it('returns 409 when user is already a contributor to the project', async () => {
    const contributor = await makeContributor(app, invitee.id, project.id)

    const payload = {
      sender_id: owner.id,
      receiver_id: contributor.user_id,
    }

    const result = await request(app)
      .post(`/projects/${contributor.project_id}/invitations`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECIPIENT_ALREADY_CONTRIBUTOR')
  })

  it('returns 409 when user is the project owner', async () => {
    const contributor = await makeContributor(app, invitee.id, project.id)

    const payload = {
      sender_id: contributor.user_id,
      receiver_id: owner.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/invitations`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('RECIPIENT_OWNS_PROJECT')
  })
})

describe('GET invitations', () => {
  let app: Application
  let owner: User
  let projects: Project[]
  let invitees: User[]
  let invitations: Invitation[]

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser(app, 'owner')
    projects = [
      await createTestProject(app, owner.id, 'project 1'),
      await createTestProject(app, owner.id, 'project 2'),
    ]
    invitees = [
      await createTestUser(app, 'user 1'),
      await createTestUser(app, 'user 2'),
    ]
    // reference for which invitations are expected in return
    invitations = [
      await createInvitation(app, owner.id, invitees[0].id, projects[0].id),
      await createInvitation(app, owner.id, invitees[1].id, projects[0].id),

      await createInvitation(app, owner.id, invitees[0].id, projects[1].id),
      await createInvitation(app, owner.id, invitees[1].id, projects[1].id),
    ]
  })

  it('returns all by project_id', async () => {
    const result = await request(app)
      .get(`/invitations?project_id=${projects[0].id}`)
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
    const result = await request(app)
      .get(`/invitations?receiver_id=${invitees[0].id}`)
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
    const newProject = await createTestProject(app, owner.id, 'newP')

    const result = await request(app)
      .get(`/invitations?project_id=${newProject.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })

  it('returns empty array by receiver_id if no results', async () => {
    const newUser = await createTestUser(app, 'newU')

    const result = await request(app)
      .get(`/invitations?receiver_id=${newUser.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })

  it('returns 404 when project_id not found', async () => {
    const result = await request(app)
      .get(`/invitations?project_id=${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 404 when receiver_id not found', async () => {
    const result = await request(app)
      .get(`/invitations?receiver_id=${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('returns 400 when lacking a search parameter', async () => {
    const result = await request(app)
      .get(`/invitations`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('returns 400 when provided with both project_id and receiver_id', async () => {
    const result = await request(app)
      .get(
        `/invitations?project_id=${projects[0].id}&receiver_id=${invitees[0].id}`,
      )
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('TOO_MANY_PARAMETERS')
  })
})

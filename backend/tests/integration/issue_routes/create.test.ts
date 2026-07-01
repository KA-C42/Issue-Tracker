import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { Project, User } from '../../../src/types/db.js'

// POST
// - by project owner
// - by contributor
// - all fields
// - minimal fields
// - 400 missing title
// - 404 project
// - 404 assignee_id
// - 409 title conflict
// - allow duplicate titles in diff project
// - 422 assignee not member
// - 403 creator not authorized
describe('POST /issues', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project

  beforeEach(async () => {
    app = createApp()
    const result = await createTestUser()
    owner = result.user
    ownerToken = result.token
    project = await createTestProject(app, ownerToken)
  })

  it('owner inserts a new issue, returning 201', async () => {
    const payload = {
      title: 'Somehow get captured with Ulfric?',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      details: null,
      status: 'BACKLOG',
      assignee_id: null,
      project_id: project.id,
      code: expect.any(Number),
      status_changed_at: expect.any(String),
      modified_at: expect.any(String),
      created_at: expect.any(String),
      id: expect.any(String),
    })
  })

  it('contributor inserts a new issue, returning 201', async () => {
    const { user: contributor, token: contributorToken } =
      await createTestUser('serana@aol.vamp')
    await makeContributor(contributor.id, project.id)

    const payload = {
      title: 'find mom',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      details: null,
      status: 'BACKLOG',
      assignee_id: null,
      project_id: project.id,
      code: expect.any(Number),
      status_changed_at: expect.any(String),
      modified_at: expect.any(String),
      created_at: expect.any(String),
      id: expect.any(String),
    })
  })

  it('inserts a new issue with maximal fields with status 201, returning the new row', async () => {
    const payload = {
      title: 'The worlds throat',
      details:
        'Stairs can fit enemies. Scale the steep side of the mountain to reach high hrothgar',
      status: 'IN_PROGRESS',
      assignee_id: owner.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      project_id: project.id,
      code: expect.any(Number),
      status_changed_at: expect.any(String),
      modified_at: expect.any(String),
      created_at: expect.any(String),
      id: expect.any(String),
    })
  })

  it('inserts a new issue with minimal fields with status 201, returning the new row', async () => {
    const payload = {
      title: 'build cheese wheel castle',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      details: null,
      status: 'BACKLOG',
      assignee_id: null,
      project_id: project.id,
      code: expect.any(Number),
      status_changed_at: expect.any(String),
      modified_at: expect.any(String),
      created_at: expect.any(String),
      id: expect.any(String),
    })
  })

  it('returns 400 when lacking a title', async () => {
    const payload = {}

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_ISSUE_TITLE')
  })

  it("returns 404 when project_id doesn't exist", async () => {
    const payload = {
      title: 'close the oblivion gates',
    }

    const result = await request(app)
      .post(`/projects/${crypto.randomUUID()}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 404 when assignee_id does not exist', async () => {
    const payload = {
      title: 'help nazeem',
      assignee_id: crypto.randomUUID(),
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 409 when using a duplicate title (per project)', async () => {
    const { user: newUser, token: newToken } = await createTestUser(
      'flightlessVictory@dovahs.meet',
    )
    await makeContributor(newUser.id, project.id)

    const payload = {
      title: 'defeat Alduin ',
    }

    await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const dupePayload = {
      title: payload.title,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(dupePayload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_TITLE_CONFLICT')
  })

  it('allows duplicate titles across different projects', async () => {
    const payload = {
      title: 'eat alduin',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const otherProject = await createTestProject(app, ownerToken, 'stick')
    const dupePayload = {
      title: payload.title,
    }

    const otherResult = await request(app)
      .post(`/projects/${otherProject.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(dupePayload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body.title).toBe(otherResult.body.title)
    expect(result.body.project_id).not.toBe(otherResult.body.project_id)
  })

  it('returns 422 when assignee_id is not an owner or contributor of the project', async () => {
    const { user: randomUser } = await createTestUser(
      'loneWolfPaarthy@dovahs.meet',
    )

    const payload = {
      title: 'collect greybeards breathing fee',
      assignee_id: randomUser.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_ASSIGNEE')
  })

  it('returns 403 when creator_id is not an owner or contributor of the project', async () => {
    const { token: newToken } = await createTestUser(
      'itsAMukbangWorld@dovahs.meet',
    )

    const payload = {
      title: 'eat that bilingual humanoid',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

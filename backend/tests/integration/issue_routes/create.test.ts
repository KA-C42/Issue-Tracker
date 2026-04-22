import { describe, it, expect } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  makeContributor,
} from '../helpers/createTestRows.js'

describe('POST /issues', () => {
  it('inserts a new issue with maximal fields with status 201, returning the new row', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
      details: 'workwork then more work and workworkwokrk work',
      status: 'IN_PROGRESS',
      assignee_id: user.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
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
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
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
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: user.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_ISSUE_TITLE')
  })

  it('returns 400 when lacking a creator_id', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      title: 'merp',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_CREATOR_ID')
  })

  it("returns 404 when project_id doesn't exist", async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
    }

    const result = await request(app)
      .post(`/projects/${crypto.randomUUID()}/issues`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 404 when creator_id does not exist', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: crypto.randomUUID(),
      title: 'workworkworkwork',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('CREATOR_NOT_FOUND')
  })

  it('returns 404 when assignee_id does not exist', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
      assignee_id: crypto.randomUUID(),
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 409 when using a duplicate title (per project)', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const otherUser = await createTestUser(app, 'wenk')
    const project = await createTestProject(app, user.id)
    await makeContributor(app, otherUser.id, project.id)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
    }

    await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const dupePayload = {
      creator_id: otherUser.id,
      title: payload.title,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(dupePayload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_TITLE_CONFLICT')
  })

  it('allows duplicate titles across different projects', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id, 'rock')

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const otherProject = await createTestProject(app, user.id, 'stick')
    const dupePayload = {
      creator_id: user.id,
      title: payload.title,
    }

    const otherResult = await request(app)
      .post(`/projects/${otherProject.id}/issues`)
      .send(dupePayload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body.title).toBe(otherResult.body.title)
    expect(result.body.project_id).not.toBe(otherResult.body.project_id)
  })

  it('returns 422 when assignee_id is not an owner or contributor of the project', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const randomUser = await createTestUser(app, 'Paarthurnax')
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: user.id,
      title: 'workworkworkwork',
      assignee_id: randomUser.id,
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_ASSIGNEE')
  })

  it('returns 422 when creator_id is not an owner or contributor of the project', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const randomUser = await createTestUser(app, 'Paarthurnax')
    const project = await createTestProject(app, user.id)

    const payload = {
      creator_id: randomUser.id,
      title: 'workworkworkwork',
    }

    const result = await request(app)
      .post(`/projects/${project.id}/issues`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_CREATOR')
  })
})

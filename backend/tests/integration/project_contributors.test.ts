import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  makeContributor,
} from './helpers/createTestRows.js'

// POST
// - success
// - missing user_id
// - missing project_id
// - no matching user
// - no matching project
describe('POST /project-contributors', () => {
  it('inserts a project_contributor with status 201, returning the new row', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      user_id: user.id,
      project_id: project.id,
    }

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject(payload)
  })

  it('rejects a duplicate row request with status 409', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      project_id: project.id,
      user_id: user.id,
    }

    // set up existing row
    await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ALREADY_MADE_CONTRIBUTOR')
  })

  it('rejects request missing a user id with status 400', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      project_id: project.id,
    }

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_USER_ID')
  })

  it('rejects request missing a project id with status 400', async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const payload = {
      user_id: user.id,
    }

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_PROJECT_ID')
  })

  it('rejects request with unmatched user_id with status 404', async () => {
    const app = createApp()

    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      user_id: crypto.randomUUID(),
      project_id: project.id,
    }

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('rejects request with unmatched project_id with status 404', async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const payload = {
      user_id: user.id,
      project_id: crypto.randomUUID(),
    }

    const response = await request(app)
      .post('/project-contributors')
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })
})

// GET

describe('GET /project-contributors? ${user_id || project_id}=###', () => {
  it('gets all project-contributor rows by user, returning status 200', async () => {
    const app = createApp()

    const owner = await createTestUser(app, 'owner')
    const contributor = await createTestUser(app, 'contributor')

    const projects = []
    for (let i = 0; i < 3; i++) {
      projects[i] = await createTestProject(app, owner.id, `project${i + 1}`)
      await makeContributor(app, contributor.id, projects[i].id)
    }

    const response = await request(app)
      .get(`/project-contributors?user_id=${contributor.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    for (let i = 0; i < projects.length; i++) {
      expect(response.body[i]).toMatchObject({
        user_id: contributor.id,
        project_id: projects[i].id,
        joined_at: expect.any(String),
      })
    }
    expect(response.body).toHaveLength(projects.length)
  })

  it('gets all project-contributor rows by project, returning status 200', async () => {
    const app = createApp()

    const owner = await createTestUser(app, 'owner')
    const project = await createTestProject(app, owner.id)

    const contributors = []
    for (let i = 0; i < 3; i++) {
      contributors[i] = await createTestUser(app, `contributor${i + 1}`)
      await makeContributor(app, contributors[i].id, project.id)
    }

    const response = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    for (let i = 0; i < contributors.length; i++) {
      expect(response.body[i]).toMatchObject({
        user_id: contributors[i].id,
        project_id: project.id,
        joined_at: expect.any(String),
      })
    }

    expect(response.body).toHaveLength(contributors.length)
  })

  it('rejects request lacking queryable id with status 400', async () => {
    const app = createApp()

    const response = await request(app)
      .get(`/project-contributors`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_QUERYABLE_ID')
  })

  it('returns list of just the user with status 200 when user found but no contributor rows', async () => {
    const app = createApp()

    const username = 'nullContributor'
    const user = await createTestUser(app, username)

    const response = await request(app)
      .get(`/project-contributors?user_id=${user.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('returns list of just the project with status 200 when project found but no contributor rows', async () => {
    const app = createApp()

    const projectName = 'projecty'
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id, projectName)

    const response = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('rejects request with status 404 when no rows or user found', async () => {
    const app = createApp()

    const response = await request(app)
      .get(`/project-contributors?user_id=${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('rejects request with status 404 when no rows or project found', async () => {
    const app = createApp()

    const response = await request(app)
      .get(`/project-contributors?project_id=${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })
})

// DELETE tests
describe('DELETE /project-contributors?project_id=###&user_id=###', () => {
  it('successfully deletes a project contributor row, returning status 204', async () => {
    const app = createApp()
    const projectOwner = await createTestUser(app, 'owner')
    const project = await createTestProject(app, projectOwner.id)
    const contributor = await createTestUser(app, 'contributor')
    await makeContributor(app, contributor.id, project.id)

    await request(app)
      .delete(
        `/project-contributors?project_id=${project.id}&user_id=${contributor.id}`,
      )
      .expect(204)

    const response = await request(app)
      .get(`/project-contributors?project_id=${project.id}`)
      .expect(200)

    expect(response.body).toHaveLength(0)
  })

  // return 404
  it('rejects request with status 404 when no corresponding row found', async () => {
    const app = createApp()

    const response = await request(app)
      .delete(
        `/project-contributors?project_id=${crypto.randomUUID()}&user_id=${crypto.randomUUID()}`,
      )
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('CONTRIBUTOR_NOT_FOUND')
  })

  // return 400 pid
  it('rejects request with status 400 when missing a project_id', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)
    await makeContributor(app, user.id, project.id)

    const response = await request(app)
      .delete(`/project-contributors?user_id=${user.id}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_PROJECT_ID')
  })

  // return 400 uid
  it('rejects request with status 400 when missing a user_id', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)
    await makeContributor(app, user.id, project.id)

    const response = await request(app)
      .delete(`/project-contributors?project_id=${project.id}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_USER_ID')
  })

  it('rejects a request with status 400 when lacking any id', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)
    await makeContributor(app, user.id, project.id)

    const response = await request(app)
      .delete(`/project-contributors`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_QUERY')
  })
})

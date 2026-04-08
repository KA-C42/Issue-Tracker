import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import { createTestUser, createTestProject } from './helpers/createTestRows.js'

// POST
// - success
// - missing name
// - missing owner
// - name conflict
describe('POST /projects', () => {
  it('inserts a new project with status 201, returning the new row', async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const payload = {
      name: 'insert project success',
      description: 'successfully inserts a project row',
      owner_id: user.id,
    }

    const response = await request(app)
      .post('/projects')
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject(payload)
  })

  it('rejects new project missing a name with status 400', async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const payload = {
      description: 'see you never :P',
      owner_id: user.id,
    }

    const response = await request(app)
      .post('/projects')
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_PROJECT_NAME')
  })

  it('rejects new project missing an owner_id with status 400', async () => {
    const app = createApp()

    const payload = {
      name: 'you dont own me',
      description: 'see you never :P',
    }

    const response = await request(app)
      .post('/projects')
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_OWNER_ID')
  })

  it('rejects new project with with status 409 if the project name is already in use by the project owner', async () => {
    const app = createApp()

    const projectOwner = await createTestUser(app)

    const payload = {
      name: 'projeyMcProject',
      description: 'the one and only',
      owner_id: projectOwner.id,
    }

    // create initial project row
    await request(app)
      .post('/projects')
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const cloneProject = await request(app)
      .post('/projects')
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(cloneProject.body.error.code).toBe('PROJECT_NAME_CONFLICT')
  })
})

// GET by id
// - 132 success
// - 150 no project
describe('GET /projects/:id', () => {
  it('selects a project by id with status 200', async () => {
    const app = createApp()

    const user = await createTestUser(app)

    const created = await createTestProject(app, user.id)

    const response = await request(app)
      .get(`/projects/${created.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      name: created.name,
      description: created.description,
      id: created.id,
    })
  })

  it('rejects get request for non-existent project with status 404', async () => {
    const app = createApp()

    const response = await request(app)
      .get(`/projects/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })
})

// GET ALL by owner_id
// - 156 success
// - 171 no projects
// - 183 missing owner_id
describe('GET /projects?owner_id=###', () => {
  it('selects all projects with a given owner_id with status 200', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    for (let i = 0; i < 3; i++) {
      await createTestProject(app, user.id, `project ${i + 1}`)
    }

    const response = await request(app)
      .get(`/projects?owner_id=${user.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(3)
  })

  it('get by owner id returns empty array with status 200 when 0 responses', async () => {
    const app = createApp()
    const user = await createTestUser(app)

    const response = await request(app)
      .get(`/projects?owner_id=${user.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('rejects a request for projects by owner_id missing an owner_id with status 400', async () => {
    const app = createApp()

    const response = await request(app)
      .get('/projects')
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_OWNER_ID')
  })
})

// PATCH
// - success
// - success on partial update
// - missing both new name/description
// - missing project id
// - no project
describe('PATCH /projects/:id', () => {
  it("updates a project's name, description, and modified_at field with status 200", async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      name: 'newProjectName',
      description: 'updated description',
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body.id).toBe(project.id)
    expect(response.body.name).toBe(payload.name)
    expect(response.body.description).toBe(payload.description)
    expect(response.body.modified_at).not.toBe(project.modified_at)
  })

  it('successful partial update, updating description and modified_at with status 200', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(
      app,
      user.id,
      'old name',
      'old description',
    )

    const payload = {
      name: undefined,
      description: 'new description',
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body.id).toBe(project.id)
    expect(response.body.name).toBe(project.name)
    expect(response.body.description).toBe(payload.description)
    expect(response.body.modified_at).not.toBe(project.modified_at)
  })

  it('rejects a request which lacks any updateable fields with status 400', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    const payload = {
      name: undefined,
      description: undefined,
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('NO_PROJECT_FIELDS_PROVIDED')
  })

  it('rejects a patch request missing project id with status 404', async () => {
    const app = createApp()

    const payload = {
      name: 'newy',
      description: 'should not',
    }

    const response = await request(app)
      .patch('/projects')
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
  })

  it('rejects a request to modify a nonexistent project with status 404', async () => {
    const app = createApp()

    const payload = {
      name: 'newProjectName',
      description: 'updated description',
    }

    const response = await request(app)
      .patch(`/projects/${crypto.randomUUID()}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })
})

// DELETE
// - success
// - no project
describe('DELETE /projects/:id', () => {
  it('deletes a project, returning code 204', async () => {
    const app = createApp()
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)

    await request(app).delete(`/projects/${project.id}`).expect(204)

    // verify project is gone
    await request(app)
      .get(`/projects/${project.id}`)
      .expect(404)
      .expect('Content-Type', /json/)
  })

  it('rejects a delete-project request with status 404 when project not found', async () => {
    const app = createApp()

    const response = await request(app)
      .delete(`/projects/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })
})

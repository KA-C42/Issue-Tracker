import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
} from './helpers/createTestRows.js'
import { Application } from 'express'
import { Project, User } from '../../src/types/db.js'
import { createAuthToken } from './helpers/createAuthToken.js'

// POST
// - success
// - missing name
// - missing code
// - name conflict
describe('POST /projects', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
  })

  it('inserts a new project with status 201, returning the new row', async () => {
    const payload = {
      name: 'insert project success',
      description: 'successfully inserts a project row',
      code: 'CODE',
    }

    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject(payload)
  })

  it('rejects new project missing a name with status 400', async () => {
    const payload = {
      description: 'see you never :P',
      owner_id: user.id,
    }

    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_PROJECT_NAME')
  })

  it('rejects new project missing a code with status 400', async () => {
    const payload = {
      name: 'you dont own me',
      description: 'see you never :P',
    }

    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_PROJECT_CODE')
  })

  it('rejects new project with with status 409 if the project name is already in use by the project owner', async () => {
    const payload = {
      name: 'projeyMcProject',
      description: 'the one and only',
      owner_id: user.id,
      code: 'CODE',
    }

    // create initial project row
    await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    const cloneProject = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(cloneProject.body.error.code).toBe('PROJECT_NAME_CONFLICT')
  })

  it('rejects new project with project code greater than 4 characters with status 400', async () => {
    const payload = {
      name: 'you dont own me',
      description: 'see you never :P',
      code: 'three',
    }

    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('INVALID_CODE')
  })

  it('rejects new project with project code containing non-alphanumeric characters with status 400', async () => {
    const payload = {
      name: 'you dont own me',
      description: 'see you never :P',
      code: ':3',
    }

    const response = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('INVALID_CODE')
  })
})

// GET by id
// - success
// - no project
describe('GET /projects/:id', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
    project = await createTestProject(app, token, 'testProj', 'PROJ')
  })

  it('selects a project by id with status 200', async () => {
    const response = await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject(project)
  })

  it('rejects get request for non-existent project with status 404', async () => {
    const response = await request(app)
      .get(`/projects/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('rejects request by unauthorized user (neither contributor or owner) with status 403', async () => {
    const newUser = await createTestUser('new@other.asfd')
    const newToken = createAuthToken(newUser.id)

    const response = await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

// GET ALL by token id as owner or contributor
// - success
// - no projects
describe('GET /projects by session id, owned + contributing', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
  })

  it('returns owned/contributing in order of owned (created_at ASC), then contributing (joined_at ASC)', async () => {
    const user2 = await createTestUser('uggh@sleepy.snore')
    const token2 = createAuthToken(user2.id)

    // making contributor projects first to ensure verification of ORDER BY (default return would fail)

    const contributingProjects: Project[] = await Promise.all([
      createTestProject(app, token2, 'contributing2'),
      createTestProject(app, token2, 'contributing3'),
    ])

    await makeContributor(user.id, contributingProjects[0].id)
    await makeContributor(user.id, contributingProjects[1].id)

    const ownedProjects: Project[] = await Promise.all([
      createTestProject(app, token, 'owned1'),
      createTestProject(app, token, 'owned2'),
    ])

    // should be omitted
    const otherProject = await createTestProject(app, token2, 'nunya')

    const response = await request(app)
      .get(`/projects`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject([
      ...ownedProjects,
      ...contributingProjects,
    ])
    expect(response.body).not.toContain(otherProject)
  })

  it('returns empty array when session user has 0 owned/contributing projects', async () => {
    const response = await request(app)
      .get(`/projects`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toStrictEqual([])
  })
})

// PATCH
// - success
// - success on partial update
// - missing both new name/description
// - missing project id
// - no project
describe('PATCH /projects/:id', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
    project = await createTestProject(
      app,
      token,
      'project',
      'PROJ',
      'description',
    )
  })

  it("updates a project's name, description, code, and modified_at field with status 200", async () => {
    const payload = {
      name: 'newProjectName',
      description: 'updated description',
      code: 'RAWR',
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      id: project.id,
      ...payload,
    })
    expect(response.body.modified_at).not.toBe(project.modified_at)
  })

  it('successful partial update, updating description and modified_at with status 200', async () => {
    const payload = {
      description: 'new description',
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      ...payload,
      id: project.id,
      name: project.name,
      code: project.code,
    })
    expect(response.body.modified_at).not.toBe(project.modified_at)
  })

  it('rejects a request which lacks any updateable fields with status 400', async () => {
    const payload = {}

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('NO_PROJECT_FIELDS_PROVIDED')
  })

  it('rejects a patch request missing project id with status 404', async () => {
    const payload = {
      name: 'newy',
      description: 'should not',
    }

    const response = await request(app)
      .patch('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
  })

  it('rejects a request to modify a nonexistent project with status 404', async () => {
    const payload = {
      name: 'newProjectName',
      description: 'updated description',
    }

    const response = await request(app)
      .patch(`/projects/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('rejects a request by a non-project-owner with status 403', async () => {
    const newUser = await createTestUser('seepy@eepy.zzz')
    const newToken = createAuthToken(newUser.id)

    const payload = {
      name: 'newProjectName',
      description: 'updated description',
      code: 'RAWR',
    }

    const response = await request(app)
      .patch(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

// DELETE
// - success
// - no project
describe('DELETE /projects/:id', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
    project = await createTestProject(app, token, 'project')
  })

  it('deletes a project, returning code 204', async () => {
    await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    // verify project is gone
    await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)
  })

  it('rejects a delete-project request with status 404 when project not found', async () => {
    const response = await request(app)
      .delete(`/projects/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('rejects a request by non-owner with status 403', async () => {
    const newUser = await createTestUser('sdf@fasds.fasd')
    const newToken = createAuthToken(newUser.id)

    const response = await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

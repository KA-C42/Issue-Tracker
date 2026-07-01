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

// GET
describe('GET /projects/:id/contributors and /profiles/:id/contributors', () => {
  let app: Application
  let token: string

  beforeEach(async () => {
    app = createApp()
    ;({ token } = await createTestUser())
  })

  it('gets all project-contributor rows by user, returning status 200', async () => {
    const { user: contributor, token: contributorToken } =
      await createTestUser('contributor@m.m')

    const projects = []
    for (let i = 0; i < 3; i++) {
      projects[i] = await createTestProject(app, token, `project${i + 1}`)
      await makeContributor(contributor.id, projects[i].id)
    }

    const response = await request(app)
      .get(`/profiles/${contributor.id}/contributors`)
      .set('Authorization', `Bearer ${contributorToken}`)
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
    const project = await createTestProject(app, token)

    const contributors = []
    for (let i = 0; i < 3; i++) {
      contributors[i] = await createTestUser(`contributor${i + 1}@team.work`)
      await makeContributor(contributors[i].user.id, project.id)
    }

    const response = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    for (let i = 0; i < contributors.length; i++) {
      expect(response.body[i]).toMatchObject({
        user_id: contributors[i].user.id,
        project_id: project.id,
        joined_at: expect.any(String),
      })
    }

    expect(response.body).toHaveLength(contributors.length)
  })

  it('returns list of just the user with status 200 when user found but no contributor rows', async () => {
    const app = createApp()

    const { user, token } = await createTestUser('newbie@project.free')

    const response = await request(app)
      .get(`/profiles/${user.id}/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('returns list of just the project with status 200 when project found but no contributor rows', async () => {
    const app = createApp()

    const projectName = 'projecty'
    const project = await createTestProject(app, token, projectName)

    const response = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('rejects request with status 404 when no rows or project found', async () => {
    const response = await request(app)
      .get(`/projects/${crypto.randomUUID()}/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('returns 403 when requesting by project_id the user is not a member of', async () => {
    const project = await createTestProject(app, token)

    const { token: newToken } = await createTestUser('i@see.you')

    const response = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

// DELETE tests
// - by project owner
// - by contributor
// - 404 no contributor row
// - 403 by project owner
// - 403 by contributor
describe('DELETE project-contributors', () => {
  let app: Application
  let ownerToken: string
  let project: Project
  let contributor: User
  let contributorToken: string

  beforeEach(async () => {
    app = createApp()
    ;({ token: ownerToken } = await createTestUser('i@own.u'))
    project = await createTestProject(app, ownerToken)
    ;({ user: contributor, token: contributorToken } =
      await createTestUser('help@ful.helper'))
    await makeContributor(contributor.id, project.id)
  })

  it('owner successfully deletes a project contributor row, returning status 204', async () => {
    await request(app)
      .delete(`/projects/${project.id}/contributors/${contributor.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204)

    const response = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(response.body).toHaveLength(0)
  })

  it('contributor successfully deletes a project contributor row, returning status 204', async () => {
    await request(app)
      .delete(`/profiles/${contributor.id}/contributors/${project.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(204)

    const response = await request(app)
      .get(`/profiles/${contributor.id}/contributors/`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)

    expect(response.body).toHaveLength(0)
  })

  it('rejects request through /projects by non-owner with 403', async () => {
    const response = await request(app)
      .delete(`/projects/${project.id}/contributors/${contributor.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(403)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('rejects request through /profiles by non-profile-owner with 403', async () => {
    const response = await request(app)
      .delete(`/profiles/${contributor.id}/contributors/${project.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

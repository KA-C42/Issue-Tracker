import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
  createTestIssue,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from '../helpers/createAuthToken.js'
import { Project, User } from '@issue-tracker/shared'

describe('GET me/contributors', () => {
  let app: Application
  let owner: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser()
    token = await createAuthToken(owner.id)
  })

  it('gets all project-contributor rows by user, returning status 200', async () => {
    const contributor = await createTestUser('contributor')
    const contributorToken = await createAuthToken(contributor.id)

    const projects = []
    for (let i = 0; i < 3; i++) {
      projects[i] = await createTestProject(app, token, `project${i + 1}`)
      await makeContributor(contributor.id, projects[i].id)
    }

    const response = await request(app)
      .get(`/me/contributors`)
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

  it('returns list of just the user with status 200 when user found but no contributor rows', async () => {
    const app = createApp()

    const user = await createTestUser('newbie@project.free')
    const token = await createAuthToken(user.id)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('rejects request with status 404 when no rows or user found', async () => {
    const fakeId = crypto.randomUUID()
    const fakeIdToken = await createAuthToken(fakeId)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${fakeIdToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })
})

describe('DELETE project-contributors', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project
  let contributor: User
  let contributorToken: string

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser('i@own.you')
    ownerToken = await createAuthToken(owner.id)
    project = await createTestProject(app, ownerToken)
    contributor = await createTestUser('live@to.serve')
    contributorToken = await createAuthToken(contributor.id)
    await makeContributor(contributor.id, project.id)
  })

  it('contributor successfully deletes a project contributor row, returning status 204', async () => {
    await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(204)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)

    expect(response.body).toHaveLength(0)
  })

  // return 404
  it('rejects request with status 404 when no corresponding row found', async () => {
    const fakeId = crypto.randomUUID()
    const fakeIdToken = await createAuthToken(fakeId)

    const response = await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${fakeIdToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('CONTRIBUTOR_NOT_FOUND')
  })

  it('rejects owner leaving their own project via /me/contributors with CANNOT_REMOVE_OWNER', async () => {
    const response = await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('CANNOT_REMOVE_OWNER')

    const contributors = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(contributors.body).toContainEqual(
      expect.objectContaining({ project_id: project.id }),
    )
  })

  it("leaving a project drops only that project's issues from /me/issues", async () => {
    // assigned one issue in `project` (will leave) and one in `other` (stays)
    const other = await createTestProject(app, ownerToken, 'other')
    await makeContributor(contributor.id, other.id)
    await createTestIssue(app, ownerToken, project.id, 'left', contributor.id)
    await createTestIssue(app, ownerToken, other.id, 'kept', contributor.id)

    await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(204)

    const myIssues = await request(app)
      .get('/me/issues')
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)

    expect(myIssues.body).toHaveLength(1)
    expect(myIssues.body[0].project_id).toBe(other.id)
  })
})

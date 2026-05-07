import { beforeEach, describe, expect, it } from 'vitest'
import createApp from '../../../src/api/app'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
} from '../helpers/createTestRows'
import request from 'supertest'
import { Application } from 'express'
import { seedVariedIssues, seedVariedIssuesReturn } from '../helpers/seedDb'
import { Issue, Project, User } from '../../../src/types/db'
import { createAuthToken } from '../helpers/createAuthToken'

// GET collections
// - by project
// - empty by project
// - 404 project
// - by assignee
// - empty by assignee
// - 404 assignee
// - 400 no query/params
// - by project and assignee
// - filter by status
// - 403 by project
// - 403 by assignee
describe('GET /issues collection', () => {
  let app: Application
  let seed: seedVariedIssuesReturn

  beforeEach(async () => {
    app = createApp()
    seed = await seedVariedIssues(app)
  })

  it('GET issues by project_id returns only that projects issues, ordered by status', async () => {
    const result = await request(app)
      .get(`/projects/${seed.mainProject.id}/issues`)
      .set('Authorization', `Bearer ${seed.ownerToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as Issue[]

    const expected = seed.issues.filter(
      (issue) => issue.project_id === seed.mainProject.id,
    )

    expect(body.length).toBe(expected.length)

    const statusOrder = { BACKLOG: 1, IN_PROGRESS: 2, DONE: 3 }
    let prevOrder = 0
    for (const issue of body) {
      expect(issue.project_id).toBe(seed.mainProject.id)

      const order = statusOrder[issue.status]
      expect(order).toBeGreaterThanOrEqual(prevOrder)
      prevOrder = order
    }
  })

  it('GETs an empty array when project_id exists but has no issues, status 200', async () => {
    const emptyProject = await createTestProject(app, seed.ownerToken)

    const result = await request(app)
      .get(`/projects/${emptyProject.id}/issues`)
      .set('Authorization', `Bearer ${seed.ownerToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(0)
  })

  it('returns 404 when project_id not found', async () => {
    const result = await request(app)
      .get(`/projects/${crypto.randomUUID()}/issues`)
      .set('Authorization', `Bearer ${seed.ownerToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('GET issues by assignee_id returns only that users assigned issues, ordered by status', async () => {
    const contributorToken = createAuthToken(seed.projectContributor.id)
    const result = await request(app)
      .get(`/issues?assignee_id=${seed.projectContributor.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as Issue[]

    const expected = seed.issues.filter(
      (issue) => issue.assignee_id === seed.projectContributor.id,
    )

    expect(body.length).toBe(expected.length)

    const statusOrder = { BACKLOG: 1, IN_PROGRESS: 2, DONE: 3 }
    let prevOrder = 0
    for (const issue of body) {
      expect(issue.assignee_id).toBe(seed.projectContributor.id)

      const order = statusOrder[issue.status]
      expect(order).toBeGreaterThanOrEqual(prevOrder)
      prevOrder = order
    }
  })

  it('GETs an empty array when assignee_id exists but has no issues, status 200', async () => {
    const newUser = await createTestUser('u@jkjk.afs')
    const newToken = createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/issues?assignee_id=${newUser.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(0)
  })

  it('returns 404 when assignee_id not found', async () => {
    const fakeId = crypto.randomUUID()
    const fakeIdToken = createAuthToken(fakeId)

    const result = await request(app)
      .get(`/issues?assignee_id=${fakeId}`)
      .set('Authorization', `Bearer ${fakeIdToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 400 when no assignee_id or project_id is provided', async () => {
    const result = await request(app)
      .get(`/issues`)
      .set('Authorization', `Bearer ${seed.ownerToken}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('GETs by project_id and assignee_id when both are provided, ordered by status', async () => {
    const result = await request(app)
      .get(
        `/projects/${seed.mainProject.id}/issues?assignee_id=${seed.projectContributor.id}`,
      )
      .set('Authorization', `Bearer ${seed.ownerToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as Issue[]
    const expected = seed.issues.filter(
      (issue) =>
        issue.assignee_id === seed.projectContributor.id &&
        issue.project_id === seed.mainProject.id,
    )
    expect(body.length).toBe(expected.length)

    const statusOrder = { BACKLOG: 1, IN_PROGRESS: 2, DONE: 3 }
    let prevOrder = 0
    for (const issue of body) {
      expect(issue.project_id).toBe(seed.mainProject.id)
      expect(issue.assignee_id).toBe(seed.projectContributor.id)

      const order = statusOrder[issue.status]
      expect(order).toBeGreaterThanOrEqual(prevOrder)
      prevOrder = order
    }
  })

  it('allows filter by status', async () => {
    const contributorToken = createAuthToken(seed.projectContributor.id)
    const status = 'IN_PROGRESS'

    const result = await request(app)
      .get(`/issues?assignee_id=${seed.projectContributor.id}&status=${status}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as Issue[]

    const expected = seed.issues.filter(
      (issue) =>
        issue.assignee_id === seed.projectContributor.id &&
        issue.status === status,
    )

    expect(body.length).toBe(expected.length)

    for (const issue of body) {
      expect(issue.assignee_id).toBe(seed.projectContributor.id)
      expect(issue.status).toBe(status)
    }
  })

  it('returns 403 by project if not member', async () => {
    const newUser = await createTestUser('let@me.in')
    const newToken = createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/projects/${seed.mainProject.id}/issues`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 by assignee id (specifically no project id) if not assignee', async () => {
    const newUser = await createTestUser('snoopy@no.privacy')
    const newToken = createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/issues?assignee_id=${seed.projectContributor.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

describe('GET /issues/:id', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = createAuthToken(user.id)
    project = await createTestProject(app, token)
    issue = await createTestIssue(app, token, project.id)
  })
  it('success with status 200', async () => {
    const result = await request(app)
      .get(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject(issue)
  })

  it('returns 400 when missing id', async () => {
    const result = await request(app)
      .get('/issues')
      .set('Authorization', `Bearer ${token}`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('returns 404 when issue not found', async () => {
    const result = await request(app)
      .get(`/issues/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 403 when token id not member of issue project', async () => {
    const otherUser = await createTestUser('sds@jnk.sfds')
    const otherToken = createAuthToken(otherUser.id)

    const result = await request(app)
      .get(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

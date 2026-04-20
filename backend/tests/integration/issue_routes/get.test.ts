import { beforeEach, describe, expect, it } from 'vitest'
import createApp from '../../../src/api/app'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  issue,
} from '../helpers/createTestRows'
import request from 'supertest'
import { Application } from 'express'
import { seedVariedIssues, seedVariedIssuesReturn } from '../helpers/seedDb'

describe('GET issues collection', () => {
  let app: Application
  let seed: seedVariedIssuesReturn

  beforeEach(async () => {
    app = createApp()
    seed = await seedVariedIssues(app)
  })

  it('GET issues by project_id returns only that projects issues, ordered by status', async () => {
    const result = await request(app)
      .get(`/projects/${seed.mainProject.id}/issues`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as issue[]

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
    const emptyProject = await createTestProject(
      app,
      seed.mainProjectOwner.id,
      'empty project',
    )

    const result = await request(app)
      .get(`/projects/${emptyProject.id}/issues`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(0)
  })

  it('returns 404 when project_id not found', async () => {
    const result = await request(app)
      .get(`/projects/${crypto.randomUUID()}/issues`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('PROJECT_NOT_FOUND')
  })

  it('GET issues by assignee_id returns only that users assigned issues, ordered by status', async () => {
    const result = await request(app)
      .get(`/issues?assignee_id=${seed.projectContributor.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as issue[]

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
    const newUser = await createTestUser(app, 'newUser')

    const result = await request(app)
      .get(`/issues?assignee_id=${newUser.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(0)
  })

  it('returns 404 when assignee_id not found', async () => {
    const result = await request(app)
      .get(`/issues?assignee_id=${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 400 when no assignee_id or project_id is provided', async () => {
    const result = await request(app)
      .get(`/issues`)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('GETs by project_id and assignee_id when both are provided, ordered by status', async () => {
    const result = await request(app)
      .get(
        `/projects/${seed.mainProject.id}/issues?assignee_id=${seed.projectContributor.id}`,
      )
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as issue[]
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
    const status = 'IN_PROGRESS'
    const result = await request(app)
      .get(`/issues?assignee_id=${seed.projectContributor.id}&status=${status}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const body = result.body as issue[]

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
})

describe('GET /issues/:id', () => {
  let app: Application

  beforeEach(() => {
    app = createApp()
  })
  it('success with status 200', async () => {
    const user = await createTestUser(app)
    const project = await createTestProject(app, user.id)
    const issue = await createTestIssue(app, user.id, project.id)

    const result = await request(app)
      .get(`/issues/${issue.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject(issue)
  })

  it('returns 400 when missing id', async () => {
    const result = await request(app)
      .get('/issues')
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_SEARCH_PARAMETER')
  })

  it('returns 404 when issue not found', async () => {
    const result = await request(app)
      .get(`/issues/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import { createTestUser } from '../helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from '../helpers/createAuthToken.js'
import { seedVariedIssues, seedVariedIssuesReturn } from '../helpers/seedDb.js'
import { Issue } from '@issue-tracker/shared'

describe('GET /me/issues', () => {
  let app: Application
  let seed: seedVariedIssuesReturn

  beforeEach(async () => {
    app = createApp()
    seed = await seedVariedIssues(app)
  })

  it('GET issues by assignee_id returns only that users assigned issues, ordered by status', async () => {
    const contributorToken = await createAuthToken(seed.projectContributor.id)
    const result = await request(app)
      .get(`/me/issues/`)
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
    const newToken = await createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/me/issues`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(0)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import createApp from '../../../src/api/app'
import { Application } from 'express'
import request from 'supertest'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  issue,
  project,
  user,
} from '../helpers/createTestRows'

describe('DELETE issues', () => {
  let app: Application
  let user: user
  let project: project
  let issue: issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(app)
    project = await createTestProject(app, user.id)
    issue = await createTestIssue(app, user.id, project.id)
  })

  it('deletes an issue, returning code 204', async () => {
    await request(app).delete(`/issues/${issue.id}`).expect(204)

    // verify project is gone
    await request(app)
      .get(`/issues/${issue.id}`)
      .expect(404)
      .expect('Content-Type', /json/)
  })

  it('rejects a delete request with status 404 when issue not found', async () => {
    const response = await request(app)
      .delete(`/issues/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ISSUE_NOT_FOUND')
  })
})

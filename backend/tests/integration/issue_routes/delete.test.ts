import { beforeEach, describe, expect, it } from 'vitest'
import createApp from '../../../src/api/app'
import { Application } from 'express'
import request from 'supertest'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  makeContributor,
} from '../helpers/createTestRows'
import { Issue, Project } from '../../../src/types/db'

// DELETE
// - success
// - 404
// - 403
describe('DELETE issues', () => {
  let app: Application
  let token: string
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    ;({ token } = await createTestUser())
    project = await createTestProject(app, token)
    issue = await createTestIssue(app, token, project.id)
  })

  it('deletes an issue, returning code 204', async () => {
    await request(app)
      .delete(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    // verify issue is gone
    await request(app)
      .get(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)
  })

  it('rejects a delete request with status 404 when issue not found', async () => {
    const response = await request(app)
      .delete(`/issues/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 403 when request made by non owner/creator', async () => {
    const { user: newUser, token: newToken } =
      await createTestUser('gonna@tack.you')
    await makeContributor(newUser.id, project.id)

    const response = await request(app)
      .delete(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

import { Application } from 'express'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  makeContributor,
} from '../helpers/createTestRows'
import { Issue, Project, User } from '../../../src/types/db'
import createApp from '../../../src/api/app'
import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

// PATCH
// - success maximum fields
// - success only status
// - success only assignee
// - success assignee to null
// - success only details
// - 400 no body
// - 404 issue
// - 404 assignee
// - 422 assignee

// - success creator patches
// - success project owner patches
// - success non-creator/owner assignee changes status
// - 403 non-creator/owner assignee changes non-status field
// - 403 non-creator/owner/assignee
describe('PATCH /issues', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    ;({ user, token } = await createTestUser())
    project = await createTestProject(app, token)
    issue = await createTestIssue(
      app,
      token,
      project.id,
      'old title',
      user.id,
      'BACKLOG',
    )
  })

  it('returns 200 patching maximum fields of issue without changing others', async () => {
    const { user: newUser } = await createTestUser('looking@for.work')
    await makeContributor(newUser.id, project.id)

    const payload = {
      title: 'new title',
      details: 'new details',
      status: 'DONE',
      assignee_id: newUser.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...payload,
      id: issue.id,
      creator_id: issue.creator_id,
      project_id: issue.project_id,
      code: issue.code,
      status_changed_at: expect.any(String),
      modified_at: expect.any(String),
      created_at: issue.created_at,
    })
    expect(modifiedIssue.status_changed_at).not.toBe(issue.status_changed_at)
    expect(modifiedIssue.modified_at).not.toBe(issue.modified_at)
  })

  it('patches only status, updating the status changed_at', async () => {
    const payload = {
      status: 'DONE',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      status: payload.status,
      status_changed_at: expect.any(String),
      id: issue.id,
      creator_id: issue.creator_id,
      project_id: issue.project_id,
      title: issue.title,
      details: issue.details,
      assignee_id: issue.assignee_id,
      code: issue.code,
      modified_at: issue.modified_at,
      created_at: issue.created_at,
    })
    expect(modifiedIssue.status_changed_at).not.toBe(issue.status_changed_at)
  })

  it('patches only assignee_id, not updating the modified_at or status_changed_at rows', async () => {
    const { user: newUser } = await createTestUser('asfd@fds.co')
    await makeContributor(newUser.id, project.id)
    const payload = {
      assignee_id: newUser.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      assignee_id: payload.assignee_id,
      id: issue.id,
      creator_id: issue.creator_id,
      project_id: issue.project_id,
      title: issue.title,
      details: issue.details,
      status: issue.status,
      code: issue.code,
      status_changed_at: issue.status_changed_at,
      modified_at: issue.modified_at,
      created_at: issue.created_at,
    })
  })

  it('sets assignee_id to null, not updating the modified_at or status_changed_at rows', async () => {
    const payload = {
      assignee_id: null,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      assignee_id: payload.assignee_id,
      id: issue.id,
      creator_id: issue.creator_id,
      project_id: issue.project_id,
      title: issue.title,
      details: issue.details,
      status: issue.status,
      code: issue.code,
      status_changed_at: issue.status_changed_at,
      modified_at: issue.modified_at,
      created_at: issue.created_at,
    })
  })

  it('patches only details, updating the modified_at row', async () => {
    const payload = {
      details:
        'do soooooo much work, like so much you will never get to live your normal life again',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      details: payload.details,
      modified_at: expect.any(String),
      id: issue.id,
      creator_id: issue.creator_id,
      project_id: issue.project_id,
      title: issue.title,
      status: issue.status,
      assignee_id: issue.assignee_id,
      code: issue.code,
      status_changed_at: issue.status_changed_at,
      created_at: issue.created_at,
    })

    expect(modifiedIssue.modified_at).not.toBe(issue.modified_at)
  })

  it('returns 400 when provided with an empty body', async () => {
    const payload = {}

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_ISSUE_PATCH_FIELDS')
  })

  it('returns 400 when provided with an empty body', async () => {
    const existingIssue = await createTestIssue(
      app,
      token,
      project.id,
      'fix that one thing',
    )

    const payload = {
      title: existingIssue.title,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_TITLE_CONFLICT')
  })

  it('returns 404 when issue id not found', async () => {
    const payload = {
      details:
        'do soooooo much work, like so much you will never get to live your normal life again',
    }
    const result = await request(app)
      .patch(`/issues/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 404 when assignee_id not found', async () => {
    const payload = {
      assignee_id: crypto.randomUUID(),
    }
    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 422 when assignee is not project owner or conributor', async () => {
    const { user: newUser } = await createTestUser('r@asf.sgg')
    const payload = {
      assignee_id: newUser.id,
    }
    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_ASSIGNEE')
  })

  it('allows the issue creator to patch all patchable fields', async () => {
    const { user: newUser, token: newToken } = await createTestUser('r@asf.sgg')
    await makeContributor(newUser.id, project.id)
    const newIssue = await createTestIssue(app, newToken, project.id, 'oldie')

    const payload = {
      title: 'new title',
      details: 'so detailed wow',
      assignee_id: newUser.id,
      status: 'DONE',
    }

    await request(app)
      .patch(`/issues/${newIssue.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)
  })

  it('allows the project owner (who is not creator) to patch all patchable fields', async () => {
    const { user: newUser, token: newToken } =
      await createTestUser('lemme@at.it')
    await makeContributor(newUser.id, project.id)
    const newIssue = await createTestIssue(app, newToken, project.id)

    const payload = {
      title: 'new title',
      details: 'so detailed wow',
      assignee_id: newUser.id,
      status: 'DONE',
    }

    await request(app)
      .patch(`/issues/${newIssue.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)
  })

  it('allows the assignee (who is neither owner nor creator) to patch status', async () => {
    const { user: newUser, token: newToken } =
      await createTestUser('lemme@at.it')
    await makeContributor(newUser.id, project.id)
    const newIssue = await createTestIssue(
      app,
      token,
      project.id,
      'titleytitle',
      newUser.id,
    )

    const payload = {
      status: 'DONE',
    }

    await request(app)
      .patch(`/issues/${newIssue.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)
  })

  it('returns 403 when assignee (not owner/creator) attempts patching a non-status field', async () => {
    const { user: newUser, token: newToken } =
      await createTestUser('lemme@it.now')
    await makeContributor(newUser.id, project.id)
    const newIssue = await createTestIssue(
      app,
      token,
      project.id,
      'titleytitle',
      newUser.id,
    )

    const payload = {
      title: 'grrrr',
      details: 'keeeeeep it going',
      assignee_id: user.id,
    }

    const result = await request(app)
      .patch(`/issues/${newIssue.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 when non-creator/owner/assignee user attempts a patch', async () => {
    const { user: newUser, token: newToken } =
      await createTestUser('lemme@it.now')
    await makeContributor(newUser.id, project.id)
    const newIssue = await createTestIssue(
      app,
      token,
      project.id,
      'titleytitle',
    )

    const payload = {
      title: 'grrrr',
      details: 'keeeeeep it going',
      assignee_id: user.id,
    }

    const result = await request(app)
      .patch(`/issues/${newIssue.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

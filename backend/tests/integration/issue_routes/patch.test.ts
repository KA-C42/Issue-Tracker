import { Application } from 'express'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  issue,
  makeContributor,
  project,
  user,
} from '../helpers/createTestRows'
import createApp from '../../../src/api/app'
import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

describe('PATCH issues', () => {
  let app: Application
  let user: user
  let project: project
  let issue: issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(app)
    project = await createTestProject(app, user.id)
    issue = await createTestIssue(
      app,
      user.id,
      project.id,
      'old title',
      user.id,
      'BACKLOG',
    )
  })

  it('returns 201 patching maximum fields of issue without changing others', async () => {
    const newUser = await createTestUser(app, 'newUser')
    await makeContributor(app, newUser.id, project.id)
    const payload = {
      title: 'new title',
      details: 'new details',
      status: 'DONE',
      assignee_id: newUser.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .send(payload)
      .expect(201)
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
      .send(payload)
      .expect(201)
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
    const newUser = await createTestUser(app, 'new user')
    await makeContributor(app, newUser.id, project.id)
    const payload = {
      assignee_id: newUser.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .send(payload)
      .expect(201)
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
      .send(payload)
      .expect(201)
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
      .send(payload)
      .expect(201)
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
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_ISSUE_PATCH_FIELDS')
  })

  it('returns 404 when issue id not found', async () => {
    const payload = {
      details:
        'do soooooo much work, like so much you will never get to live your normal life again',
    }
    const result = await request(app)
      .patch(`/issues/${crypto.randomUUID()}`)
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
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ASSIGNEE_NOT_FOUND')
  })

  it('returns 422 when assignee is not project owner or conributor', async () => {
    const newUser = await createTestUser(app, 'newUser')
    const payload = {
      assignee_id: newUser.id,
    }
    const result = await request(app)
      .patch(`/issues/${issue.id}`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_ASSIGNEE')
  })
})

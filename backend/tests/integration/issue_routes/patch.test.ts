import { Application } from 'express'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  makeContributor,
} from '../helpers/createTestRows'
import { Issue, Project, User } from '@issue-tracker/shared'
import createApp from '../../../src/api/app'
import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createAuthToken } from '../helpers/createAuthToken'
import { randomUUID } from 'node:crypto'

describe('PATCH /issues/:id', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
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
    const newUser = await createTestUser('looking@for.work')
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
      ...issue,
      status: payload.status,
      status_changed_at: expect.any(String),
    })
    expect(modifiedIssue.status_changed_at).not.toBe(issue.status_changed_at)
  })

  it('patches only assignee_id, not updating the modified_at or status_changed_at rows', async () => {
    const newUser = await createTestUser('asfd@fds.co')
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

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when provided with a pre-existing issue title', async () => {
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

  it('returns 422 when assignee is not project owner or conributor', async () => {
    const newUser = await createTestUser('r@asf.sgg')
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
    const newUser = await createTestUser('r@asf.sgg')
    await makeContributor(newUser.id, project.id)
    const newToken = await createAuthToken(newUser.id)
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
    const newUser = await createTestUser('lemme@at.it')
    await makeContributor(newUser.id, project.id)
    const newToken = await createAuthToken(newUser.id)
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

  it('returns 403 when assignee (not owner/creator) attempts patching', async () => {
    const newUser = await createTestUser('lemme@it.now')
    await makeContributor(newUser.id, project.id)
    const newToken = await createAuthToken(newUser.id)
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
    const newUser = await createTestUser('lemme@it.now')
    await makeContributor(newUser.id, project.id)
    const newToken = await createAuthToken(newUser.id)
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

describe('PATCH /issues/:id/status', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
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

  it('patches status, updating the status changed_at', async () => {
    const payload = {
      status: 'DONE',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...issue,
      status: payload.status,
      status_changed_at: expect.any(String),
    })
    expect(modifiedIssue.status_changed_at).not.toBe(issue.status_changed_at)
  })

  it('allows the assignee (who is neither owner nor creator) to patch status', async () => {
    const newUser = await createTestUser('lemme@at.it')
    await makeContributor(newUser.id, project.id)
    const newToken = await createAuthToken(newUser.id)
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
      .patch(`/issues/${newIssue.id}/status`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)
  })

  it('returns 403 when called by a project member that is none of: assignee, issue creator, project creator', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)
    await makeContributor(newUser.id, project.id)

    const payload = {
      status: 'DONE',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/status`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 when called by a user that is not a project member', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      status: 'DONE',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/status`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 400 when called with an invalid status', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      status: 'flarb-n-garbl',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/status`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when called with a null status', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      status: null,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/status`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('PATCH /issues/:id/assignee', () => {
  let app: Application
  let projectCreator: User
  let token: string
  let project: Project
  let issue: Issue
  let contributor: User
  let contributorToken: string

  beforeEach(async () => {
    app = createApp()
    projectCreator = await createTestUser()
    token = await createAuthToken(projectCreator.id)
    project = await createTestProject(app, token)
    issue = await createTestIssue(
      app,
      token,
      project.id,
      'old title',
      undefined,
      'BACKLOG',
    )
    contributor = await createTestUser('m@m.m')
    await makeContributor(contributor.id, project.id)
    contributorToken = await createAuthToken(contributor.id)
  })

  it('project creator can update assignee_id, returning 200', async () => {
    const payload = {
      assignee_id: contributor.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...issue,
      assignee_id: payload.assignee_id,
    })
  })

  it('issue creator can update assignee_id, returning 200', async () => {
    const newIssue = await createTestIssue(
      app,
      contributorToken,
      project.id,
      'issue',
    )
    const payload = {
      assignee_id: projectCreator.id,
    }

    const result = await request(app)
      .patch(`/issues/${newIssue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...newIssue,
      assignee_id: payload.assignee_id,
    })
  })

  it('project contributors, other than issue creator, cannot remove or replace another assigned member', async () => {
    await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignee_id: projectCreator.id })
      .expect(200)
      .expect('Content-Type', /json/)

    const replaceResult = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({
        assignee_id: contributor.id,
      })
      .expect(403)
      .expect('Content-Type', /json/)

    expect(replaceResult.body.error.code).toBe('UNAUTHORIZED_REQUEST')

    const removeResult = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({
        assignee_id: null,
      })
      .expect(403)
      .expect('Content-Type', /json/)

    expect(removeResult.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('project contributors can assign themselves when the existing assignee_id is null', async () => {
    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({
        assignee_id: contributor.id,
      })
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...issue,
      assignee_id: contributor.id,
    })
  })

  it('project contributors can unassign themselves, setting the assignee id to null', async () => {
    await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignee_id: contributor.id,
      })
      .expect(200)
      .expect('Content-Type', /json/)

    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({
        assignee_id: null,
      })
      .expect(200)
      .expect('Content-Type', /json/)

    const modifiedIssue = result.body

    expect(modifiedIssue).toMatchObject({
      ...issue,
      assignee_id: null,
    })
  })

  it('project contributors cannot assign other members', async () => {
    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .send({ assignee_id: projectCreator.id })
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 403 when called by a user that is not a project member', async () => {
    const newUser = await createTestUser('b@m.m')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      assignee_id: randomUUID(),
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 400 when called with an invalid id', async () => {
    const payload = {
      assignee_id: 'flarb-n-garbl',
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when issue id not found', async () => {
    const payload = {
      assignee_id: contributor.id,
    }

    const result = await request(app)
      .patch(`/issues/${randomUUID()}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 422 when assignee is not a project member', async () => {
    const outsider = await createTestUser('outsider@nope.com')

    const payload = {
      assignee_id: outsider.id,
    }

    const result = await request(app)
      .patch(`/issues/${issue.id}/assignee`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_ASSIGNEE')
  })
})

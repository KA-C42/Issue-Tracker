import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  user,
  project,
  issue,
  createTestIssue,
} from './helpers/createTestRows.js'
import { Application } from 'express'

describe('POST comments', () => {
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

  it('creates and returns a new comment with status 201', async () => {
    const payload = {
      author_id: user.id,
      comment: 'this looks really hard haha glad i dont have to do it :p',
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      ...payload,
      id: expect.any(String),
      issue_id: issue.id,
      created_at: expect.any(String),
      modified_at: expect.any(String),
    })
  })

  it('returns 400 when lacking text in the comment field', async () => {
    const payload = {
      author_id: user.id,
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_COMMENT_TEXT')
  })

  it('returns 400 when lacking an author_id', async () => {
    const payload = {
      comment: 'who said that!?',
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_AUTHOR_ID')
  })

  it('returns 404 when author_id not found', async () => {
    const payload = {
      author_id: crypto.randomUUID(),
      comment: 'i love my imaginary friends',
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('AUTHOR_NOT_FOUND')
  })

  it('returns 404 when issue_id not found', async () => {
    const payload = {
      author_id: user.id,
      comment: 'how did i get here?',
    }

    const result = await request(app)
      .post(`/issues/${crypto.randomUUID()}/comments`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 422 when author_id is not owner or contributor to the project', async () => {
    const newUser = await createTestUser(app, 'strangerDanger')

    const payload = {
      author_id: newUser.id,
      comment: "you're not supposed to be here",
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .send(payload)
      .expect(422)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('INVALID_AUTHOR')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestProject,
  createTestIssue,
  createTestComment,
  createTestUser,
  makeContributor,
} from './helpers/createTestRows.js'
import { Application } from 'express'
import { Comment, Issue, Project, User } from '../../src/types/db.js'
import { createAuthToken } from './helpers/createAuthToken.js'
import { getComment } from '../../src/db/services/commentServices.js'

describe('POST comments', () => {
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
    issue = await createTestIssue(app, token, project.id)
  })

  it('creates and returns a new comment with status 201', async () => {
    const payload = {
      comment: 'this looks really hard haha glad i dont have to do it :p',
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
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
    const payload = {}

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_COMMENT_TEXT')
  })

  it('returns 404 when issue_id not found', async () => {
    const payload = {
      comment: 'how did i get here?',
    }

    const result = await request(app)
      .post(`/issues/${crypto.randomUUID()}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 403 when token id is not owner or contributor to the project', async () => {
    const newUser = await createTestUser('stranger@danger.com')
    const newToken = await createAuthToken(newUser.id)

    const payload = {
      comment: "you're not supposed to be here",
    }

    const result = await request(app)
      .post(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

describe('GET comments', () => {
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
    issue = await createTestIssue(app, token, project.id)
  })

  it("returns all by issue_id, excluding other issues' comments, ordered ascending by created_at", async () => {
    const comments = []
    const commentCount = 5

    // testing returned order, comments are posted explicitly sequentially
    for (let i = 0; i < commentCount; i++) {
      comments.push(
        await createTestComment(app, token, issue.id, `comment #${i}`),
      )
    }

    // prettier-ignore
    const otherIssue = await createTestIssue(app, token, project.id, 'not my issue')
    // prettier-ignore
    const otherComment = await createTestComment(app, token, otherIssue.id, 'shhh who even cares')

    const result = await request(app)
      .get(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    const returnedComments = result.body

    expect(returnedComments.length).toBe(commentCount)
    for (let i = 0; i < commentCount; i++) {
      expect(returnedComments[i]).toMatchObject(comments[i])
      expect(returnedComments[i]).not.toMatchObject(otherComment)
    }
  })

  it('returns an empty array when issue_id search matches an issue but no comments', async () => {
    const result = await request(app)
      .get(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.length).toBe(0)
  })

  it('returns 404 when issue_id does not match an issue', async () => {
    const result = await request(app)
      .get(`/issues/${crypto.randomUUID()}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns 403 when token id is not project member', async () => {
    const newUser = await createTestUser('code@code.code')
    const newToken = await createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/issues/${issue.id}/comments`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

describe('PATCH comments', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue
  let comment: Comment

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
    project = await createTestProject(app, token)
    issue = await createTestIssue(app, token, project.id)
    comment = await createTestComment(app, token, issue.id, 'comment')
  })

  it('successfully edits, updating the comment text/modified_at and returning the updated row', async () => {
    const payload = {
      comment: "Not to worry, I'll patch you up!",
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.comment).toBe(payload.comment)

    const updatedComment = await getComment(comment.id)
    if (!updatedComment) throw new Error('missing comment')

    expect(updatedComment).toMatchObject({
      ...payload,
      id: comment.id,
    })
    expect(String(updatedComment.modified_at)).not.toMatch(comment.modified_at)
  })

  it('returns 403 when token id not author_id', async () => {
    const newUser = await createTestUser('zzz@zzz.zzz')
    const newToken = await createAuthToken(newUser.id)
    await makeContributor(newUser.id, project.id)

    const payload = {
      comment: 'boo',
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })

  it('returns 404 when comment id not found', async () => {
    const payload = {
      author_id: token,
      comment: 'boo',
    }

    const result = await request(app)
      .patch(`/comments/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('COMMENT_NOT_FOUND')
  })

  it('returns 400 when lacking comment string', async () => {
    const payload = {
      comment: null,
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_COMMENT_TEXT')
  })
})

describe('DELETE comments', () => {
  let app: Application
  let user: User
  let token: string
  let project: Project
  let issue: Issue
  let comment: Comment

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
    project = await createTestProject(app, token)
    issue = await createTestIssue(app, token, project.id)
    comment = await createTestComment(app, token, issue.id, 'comment')
  })

  it('deletes a comment, returning code 204', async () => {
    await request(app)
      .delete(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    // verify comment is gone
    const commentRow = await getComment(comment.id)
    expect(commentRow).toBeNull()
  })

  it('rejects a delete request with status 404 when comment not found', async () => {
    const response = await request(app)
      .delete(`/comments/${crypto.randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('COMMENT_NOT_FOUND')
  })

  it('returns 403 when token id is not author_id', async () => {
    const newUser = await createTestUser('m@m.m')
    const newToken = await createAuthToken(newUser.id)
    await makeContributor(newUser.id, project.id)

    const response = await request(app)
      .delete(`/comments/${comment.id}`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('UNAUTHORIZED_REQUEST')
  })
})

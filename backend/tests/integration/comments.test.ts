import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestUser,
  createTestProject,
  createTestIssue,
  createTestComment,
} from './helpers/createTestRows.js'
import { Application } from 'express'
import { Comment, Issue, Project, User } from '../../src/db/types/db.js'

describe('POST comments', () => {
  let app: Application
  let user: User
  let project: Project
  let issue: Issue

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

describe('GET comments', () => {
  let app: Application
  let user: User
  let project: Project
  let issue: Issue

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(app)
    project = await createTestProject(app, user.id)
    issue = await createTestIssue(app, user.id, project.id)
  })

  it("returns all by issue_id, excluding other issues' comments, ordered ascending by created_at", async () => {
    const comments = []
    const commentCount = 5

    // testing returned order, comments are posted explicitly sequentially
    for (let i = 0; i < commentCount; i++) {
      comments.push(
        await createTestComment(app, user.id, issue.id, `comment #${i}`),
      )
    }

    // prettier-ignore
    const otherIssue = await createTestIssue(app, user.id, project.id, 'not my issue')
    // prettier-ignore
    const otherComment = await createTestComment(app, user.id, otherIssue.id, 'shhh who even cares')

    const result = await request(app)
      .get(`/issues/${issue.id}/comments`)
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
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.length).toBe(0)
  })

  it('returns 404 when issue_id does not match an issue', async () => {
    const result = await request(app)
      .get(`/issues/${crypto.randomUUID()}/comments`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('ISSUE_NOT_FOUND')
  })

  it('returns comment by id with status 200', async () => {
    const comment = await createTestComment(app, user.id, issue.id, 'first')

    const result = await request(app)
      .get(`/comments/${comment.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject(comment)
  })

  it('returns 404 when id does not match any comment', async () => {
    const result = await request(app)
      .get(`/comments/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('COMMENT_NOT_FOUND')
  })
})

describe('PATCH comments', () => {
  let app: Application
  let user: User
  let project: Project
  let issue: Issue
  let comment: Comment

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(app)
    project = await createTestProject(app, user.id)
    issue = await createTestIssue(app, user.id, project.id)
    comment = await createTestComment(app, user.id, issue.id, 'comment')
  })

  it('successfully edits, updating the comment text/modified_at and returning the updated row', async () => {
    const payload = {
      author_id: user.id,
      comment: "Not to worry, I'll patch you up!",
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.comment).toBe(payload.comment)

    const updatedComment = await request(app)
      .get(`/comments/${comment.id}`)
      .expect(200)

    expect(updatedComment.body).toMatchObject({
      ...payload,
      id: comment.id,
      created_at: comment.created_at,
    })
    expect(updatedComment.body.modified_at).not.toMatch(comment.modified_at)
  })

  it('returns 403 when author_id not matching comments author', async () => {
    const payload = {
      author_id: crypto.randomUUID(),
      comment: 'boo',
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .send(payload)
      .expect(403)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('NOT_COMMENT_AUTHOR')
  })

  it('returns 404 when comment id not found', async () => {
    const payload = {
      author_id: user.id,
      comment: 'boo',
    }

    const result = await request(app)
      .patch(`/comments/${crypto.randomUUID()}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('COMMENT_NOT_FOUND')
  })

  it('returns 400 when lacking comment text', async () => {
    const payload = {
      author_id: crypto.randomUUID(),
      comment: null,
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_COMMENT_TEXT')
  })

  it('returns 400 when lacking author_id', async () => {
    const payload = {
      author_id: undefined,
      comment: 'the wind',
    }

    const result = await request(app)
      .patch(`/comments/${comment.id}`)
      .send(payload)
      .expect(400)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('MISSING_AUTHOR_ID')
  })
})

describe('PATCH comments', () => {
  let app: Application
  let user: User
  let project: Project
  let issue: Issue
  let comment: Comment

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser(app)
    project = await createTestProject(app, user.id)
    issue = await createTestIssue(app, user.id, project.id)
    comment = await createTestComment(app, user.id, issue.id, 'comment')
  })

  it('deletes a comment, returning code 204', async () => {
    await request(app).delete(`/comments/${comment.id}`).expect(204)

    // verify comment is gone
    await request(app)
      .get(`/comments/${comment.id}`)
      .expect(404)
      .expect('Content-Type', /json/)
  })

  it('rejects a delete request with status 404 when comment not found', async () => {
    const response = await request(app)
      .delete(`/comments/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('COMMENT_NOT_FOUND')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
  createTestIssue,
  createPopulatedProject,
  setUsername,
} from '../helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from '../helpers/createAuthToken.js'
import { Project, User } from '@issue-tracker/shared'

const cardFields = (p: Project) => ({
  id: p.id,
  title: p.title,
  code: p.code,
  description: p.description,
})

describe('GET /me/projects/owned', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
  })

  it('returns only projects the user created, ordered by created_at DESC', async () => {
    const otherUser = await createTestUser('other@test.kac')
    const otherToken = await createAuthToken(otherUser.id)

    // excluded: the user contributes to it but didn't create it
    const contributing = await createTestProject(
      app,
      otherToken,
      'contributing',
    )
    await makeContributor(user.id, contributing.id)

    // excluded: no relation to the user
    await createTestProject(app, otherToken, 'unrelated')

    const first = await createTestProject(app, token, 'owned1')
    const second = await createTestProject(app, token, 'owned2')

    const response = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body.map((p: { id: string }) => p.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('includes open issue, member, and pending invite counts', async () => {
    const empty = await createTestProject(app, token, 'empty')
    const { project } = await createPopulatedProject(app, token)

    const response = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    // empty project:
    // the owner's own contributor row is the 1 member
    expect(response.body[1]).toEqual({
      ...cardFields(empty),
      open_issue_count: 0,
      member_count: 1,
      pending_invite_count: 0,
    })

    // from createPopulatedProject:
    // 2 of 3 issues open,
    // owner + 2 contributors,
    // 2 pending invites + 1 rejected
    expect(response.body[0]).toEqual({
      ...cardFields(project),
      open_issue_count: 2,
      member_count: 3,
      pending_invite_count: 2,
    })
  })

  it('returns an empty array when the user has created no projects', async () => {
    const response = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual([])
  })

  it('returns 401 without a token', async () => {
    await request(app).get('/me/projects/owned').expect(401)
  })

  it('returns 401 with an invalid token', async () => {
    await request(app)
      .get('/me/projects/owned')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401)
  })
})

describe('GET /me/projects/contributing', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
  })

  it('returns only projects the user contributes to but did not create, ordered by joined_at DESC', async () => {
    const creator = await createTestUser('creator@test.kac')
    const creatorToken = await createAuthToken(creator.id)

    const first = await createTestProject(app, creatorToken, 'contributing1')
    const second = await createTestProject(app, creatorToken, 'contributing2')
    await makeContributor(user.id, first.id)
    await makeContributor(user.id, second.id)

    // excluded: creators get a contributor row on their own projects, so this
    // catches a query that doesn't also filter out projects the user created
    await createTestProject(app, token, 'owned')

    // excluded: the user isn't a member
    await createTestProject(app, creatorToken, 'unrelated')

    const response = await request(app)
      .get('/me/projects/contributing')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body.map((p: { id: string }) => p.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('includes the creator username and open issues assigned to the user', async () => {
    const creator = await createTestUser('creator@test.kac')
    const creatorToken = await createAuthToken(creator.id)

    const { project, contributorAccounts } = await createPopulatedProject(
      app,
      creatorToken,
    )
    await makeContributor(user.id, project.id)

    // renamed after the project exists: proves the username is joined at read time
    await setUsername(app, creator.id, 'creator', creatorToken)

    // createPopulatedProject issues are unassigned, so assign new ones here
    await Promise.all([
      createTestIssue(
        app,
        creatorToken,
        project.id,
        'mine1',
        user.id,
        'BACKLOG',
      ),
      createTestIssue(
        app,
        creatorToken,
        project.id,
        'mine2',
        user.id,
        'IN_PROGRESS',
      ),
      createTestIssue(app, creatorToken, project.id, 'mine3', user.id, 'DONE'), // excluded: closed
      createTestIssue(
        app,
        creatorToken,
        project.id,
        'theirs',
        contributorAccounts[0].id,
        'BACKLOG',
      ), // excluded: someone else's
    ])

    const response = await request(app)
      .get('/me/projects/contributing')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toEqual([
      {
        ...cardFields(project),
        creator_username: 'creator',
        assigned_open_issue_count: 2,
      },
    ])
  })

  it('returns an empty array when the user contributes to no projects', async () => {
    const response = await request(app)
      .get('/me/projects/contributing')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual([])
  })

  it('returns 401 without a token', async () => {
    await request(app).get('/me/projects/contributing').expect(401)
  })

  it('returns 401 with an invalid token', async () => {
    await request(app)
      .get('/me/projects/contributing')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401)
  })
})

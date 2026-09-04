import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import {
  createTestProject,
  createTestUser,
  makeContributor,
  createInvite,
} from './helpers/createTestRows.js'
import { Application } from 'express'
import { createAuthToken } from './helpers/createAuthToken.js'
import { seedVariedIssues, seedVariedIssuesReturn } from './helpers/seedDb.js'
import { Issue, Project, User, Invite } from '@issue-tracker/shared'

describe('/me profile routes', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
  })

  it('GET retrieves a profile by session user id with status 200', async () => {
    const result = await request(app)
      .get(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.id).toBe(user.id)
  })

  it('PATCH updates username by session user id with status 201', async () => {
    const result = await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'wetHands' })
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body.username).toBe('wetHands')
  })

  it('PATCH returns 409 when provided with a username already in use', async () => {
    const newUser = await createTestUser('b@b.b')
    const newToken = await createAuthToken(newUser.id)

    const username = 'user'
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: username })
      .expect(200)
      .expect('Content-Type', /json/)

    const result = await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${newToken}`)
      .send({ username: username })
      .expect(409)
      .expect('Content-Type', /json/)

    expect(result.body.error.code).toBe('USERNAME_CONFLICT')
  })

  it('PATCH returns 400 when provided with an invalid username', async () => {
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username:
          "Oh my, what a long username you have there. Sure would be a shame if something.... DIDN'T happen to it, huh? Sure would be a shame if it just... didn't save. Would be truly awful to have to type allllllll of that in again, so be reeeeaeaaaaaaaallll careful and maybe what you want to happen to it, actually might happen to it. You never know ;).exe",
      })
      .expect(400)
      .expect('Content-Type', /json/)
  })

  it('PATCH returns 400 when provided with a blank username', async () => {
    await request(app)
      .patch(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: '',
      })
      .expect(400)
      .expect('Content-Type', /json/)
  })

  it('DELETE soft deletes a user by setting the deactivated_at field with status 200', async () => {
    const deleted = await request(app)
      .delete(`/me/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(deleted.body.deactivated_at).toBeTruthy()
  })
})

describe('GET /me/projects', () => {
  let app: Application
  let user: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    user = await createTestUser()
    token = await createAuthToken(user.id)
  })

  it('returns owned/contributing in order of owned (created_at ASC), then contributing (joined_at ASC)', async () => {
    const user2 = await createTestUser('uggh@sleepy.snore')
    const token2 = await createAuthToken(user2.id)

    // making contributor projects first to ensure verification of ORDER BY (default return would fail)

    const contributingProjects: Project[] = await Promise.all([
      createTestProject(app, token2, 'contributing2'),
      createTestProject(app, token2, 'contributing3'),
    ])

    await makeContributor(user.id, contributingProjects[0].id)
    await makeContributor(user.id, contributingProjects[1].id)

    const ownedProjects: Project[] = [
      await createTestProject(app, token, 'owned1'),
      await createTestProject(app, token, 'owned2'),
    ]

    // should be omitted
    const otherProject = await createTestProject(app, token2, 'nunya')

    const response = await request(app)
      .get(`/me/projects`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject([
      ...ownedProjects,
      ...contributingProjects,
    ])
    expect(response.body).not.toContain(otherProject)
  })

  it('returns empty array when session user has 0 owned/contributing projects', async () => {
    const response = await request(app)
      .get(`/me/projects`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toStrictEqual([])
  })
})

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

describe('GET /me/invites', () => {
  let app: Application
  let owner: User
  let token: string
  let projects: Project[]
  let invitees: User[]
  let invites: Invite[]

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser()
    token = await createAuthToken(owner.id)
    projects = [
      await createTestProject(app, token, 'project 1'),
      await createTestProject(app, token, 'project 2'),
    ]
    invitees = [
      await createTestUser('user1@O.O'),
      await createTestUser('user2@u.u'),
    ]
    // reference for which invites are expected in return
    invites = [
      await createInvite(app, token, invitees[0].id, projects[0].id),
      await createInvite(app, token, invitees[1].id, projects[0].id),

      await createInvite(app, token, invitees[0].id, projects[1].id),
      await createInvite(app, token, invitees[1].id, projects[1].id),
    ]
  })

  it('returns all by recipient_id', async () => {
    const searchId = invitees[0].id
    const newToken = await createAuthToken(searchId)

    const result = await request(app)
      .get(`/me/invites`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toHaveLength(2)
    expect(result.body).toEqual(
      expect.arrayContaining([invites[0], invites[2]]),
    )
    expect(result.body).not.toEqual(expect.arrayContaining([invites[1]]))
    expect(result.body).not.toEqual(expect.arrayContaining([invites[3]]))
  })

  it('returns empty array by recipient_id if no results', async () => {
    const newUser = await createTestUser('new@o.o')
    const newToken = await createAuthToken(newUser.id)

    const result = await request(app)
      .get(`/me/invites`)
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toStrictEqual([])
  })
})

describe('PATCH /me/invites/:id', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project
  let invitee: User
  let inviteeToken: string
  let invite: Invite

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser('owner@m.m')
    ownerToken = await createAuthToken(owner.id)
    project = await createTestProject(app, ownerToken, 'project')
    invitee = await createTestUser('invitee@m.m')
    inviteeToken = await createAuthToken(invitee.id)
    invite = await createInvite(app, ownerToken, invitee.id, project.id)
  })
  it("creates a project_contributor row on invitee PATCH to status='ACCEPTED", async () => {
    // no project contributors yet
    const existingContributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('AUTHORIZATION', `Bearer ${ownerToken}`)
      .expect(200)

    expect(existingContributors.body).toStrictEqual([])

    const payload = {
      status: 'ACCEPTED',
    }
    const result = await request(app)
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invite.id,
      status: payload.status,
    })

    // ensure project contributor row creation
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(200)

    expect(contributors.body).toMatchObject([
      {
        user_id: invitee.id,
        project_id: project.id,
        joined_at: expect.any(String),
      },
    ])
  })

  it('returns the updated row and does not create a project_contributor row when status PATCH != ACCEPTED', async () => {
    const payload = {
      status: 'REJECTED',
    }
    const result = await request(app)
      .patch(`/me/invites/${invite.id}`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(result.body).toMatchObject({
      id: invite.id,
      status: payload.status,
    })

    // ensure project contributor row not created
    const contributors = await request(app)
      .get(`/projects/${project.id}/contributors`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)

    expect(contributors.body).toMatchObject([])
  })
})

describe('GET me/contributors', () => {
  let app: Application
  let owner: User
  let token: string

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser()
    token = await createAuthToken(owner.id)
  })

  it('gets all project-contributor rows by user, returning status 200', async () => {
    const contributor = await createTestUser('contributor')
    const contributorToken = await createAuthToken(contributor.id)

    const projects = []
    for (let i = 0; i < 3; i++) {
      projects[i] = await createTestProject(app, token, `project${i + 1}`)
      await makeContributor(contributor.id, projects[i].id)
    }

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    for (let i = 0; i < projects.length; i++) {
      expect(response.body[i]).toMatchObject({
        user_id: contributor.id,
        project_id: projects[i].id,
        joined_at: expect.any(String),
      })
    }
    expect(response.body).toHaveLength(projects.length)
  })

  it('returns list of just the user with status 200 when user found but no contributor rows', async () => {
    const app = createApp()

    const user = await createTestUser('newbie@project.free')
    const token = await createAuthToken(user.id)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toHaveLength(0)
  })

  it('rejects request with status 404 when no rows or user found', async () => {
    const fakeId = crypto.randomUUID()
    const fakeIdToken = await createAuthToken(fakeId)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${fakeIdToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })
})

describe('DELETE project-contributors', () => {
  let app: Application
  let owner: User
  let ownerToken: string
  let project: Project
  let contributor: User
  let contributorToken: string

  beforeEach(async () => {
    app = createApp()
    owner = await createTestUser('i@own.you')
    ownerToken = await createAuthToken(owner.id)
    project = await createTestProject(app, ownerToken)
    contributor = await createTestUser('live@to.serve')
    contributorToken = await createAuthToken(contributor.id)
    await makeContributor(contributor.id, project.id)
  })

  it('contributor successfully deletes a project contributor row, returning status 204', async () => {
    await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(204)

    const response = await request(app)
      .get(`/me/contributors`)
      .set('Authorization', `Bearer ${contributorToken}`)
      .expect(200)

    expect(response.body).toHaveLength(0)
  })

  // return 404
  it('rejects request with status 404 when no corresponding row found', async () => {
    const fakeId = crypto.randomUUID()
    const fakeIdToken = await createAuthToken(fakeId)

    const response = await request(app)
      .delete(`/me/contributors/${project.id}`)
      .set('Authorization', `Bearer ${fakeIdToken}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('CONTRIBUTOR_NOT_FOUND')
  })
})

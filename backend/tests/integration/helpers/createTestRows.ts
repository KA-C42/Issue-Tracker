import request from 'supertest'
import type { Application } from 'express'
import {
  Profile,
  Project,
  ProjectContributor,
  Issue,
  Comment,
  Invite,
  User,
  IssueStatus,
} from '@issue-tracker/shared'
import { pool } from '../../../src/db/pool'

const createTestUser = async (
  email: string = 'hacker42@aol.gotcha',
): Promise<User> => {
  const text = 'INSERT INTO auth.users (id, email) VALUES ($1, $2) RETURNING *'
  const values = [crypto.randomUUID(), email]

  const result = await pool.query(text, values)
  return result.rows[0]
}

const createTestProfile = async (
  app: Application,
  username: string = 'testProfile',
): Promise<Profile> => {
  const response = await request(app)
    .post('/profiles')
    .send({ username: username })
    .expect(201)

  return {
    id: response.body.id,
    username: response.body.username,
  } as Profile
}

const setUsername = async (
  app: Application,
  id: string,
  username: string,
  token: string,
): Promise<Profile> => {
  const response = await request(app)
    .patch(`/me/profile`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      username: username,
    })
    .expect(200)

  return response.body as Profile
}

const createTestProject = async (
  app: Application,
  token: string,
  title: string = 'testProject',
  code: string = 'PROJ',
  description: string = 'project for dev testing only',
): Promise<Project> => {
  const response = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: title,
      description: description,
      code: code,
    })
    .expect(201)

  return response.body as Project
}

const makeContributor = async (
  user_id: string,
  project_id: string,
): Promise<ProjectContributor> => {
  const text = `
    INSERT INTO project_contributors (user_id, project_id) 
    VALUES ($1, $2)
    RETURNING *
  `

  const values = [user_id, project_id]

  const result = await pool.query(text, values)

  return result.rows[0]
}

const removeContributor = async (
  user_id: string,
  project_id: string,
): Promise<void> => {
  const text = `
    DELETE FROM project_contributors
    WHERE user_id = $1 AND project_id = $2
  `
  const values = [user_id, project_id]

  const result = await pool.query(text, values)
  if (result.rowCount !== 1)
    throw new Error(
      `removeContributor: ${user_id} not a contributor of ${project_id}`,
    )
}

const createTestIssue = async (
  app: Application,
  token: string,
  project_id: string,
  title: string = 'issue',
  assignee_id: string | undefined = undefined,
  status?: IssueStatus,
): Promise<Issue> => {
  const response = await request(app)
    .post(`/projects/${project_id}/issues`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: title,
      assignee_id: assignee_id,
      status: status,
    })
    .expect(201)

  return response.body as Issue
}

const createTestComment = async (
  app: Application,
  token: string,
  issue_id: string,
  comment: string = 'blah blah blahbalh',
): Promise<Comment> => {
  const response = await request(app)
    .post(`/issues/${issue_id}/comments`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      comment: comment,
    })
    .expect(201)

  return response.body as Comment
}

const createInvite = async (
  app: Application,
  token: string,
  recipient_id: string,
  project_id: string,
  status: Invite['status'] = 'PENDING',
): Promise<Invite> => {
  // route takes a username; look it up so callers can keep passing ids
  const { rows: userRows } = await pool.query(
    'SELECT username FROM profiles WHERE id = $1',
    [recipient_id],
  )

  const response = await request(app)
    .post(`/projects/${project_id}/invites`)
    .set('Authorization', `Bearer ${token}`)
    .send({ recipient_username: userRows[0].username })
    .expect(201)

  const invite = response.body

  // update status after, rather than in main request, to trigger create-contributor db trigger (UPDATE only)
  if (status === 'PENDING') return invite

  const { rows: updateRows } = await pool.query(
    'UPDATE invites SET status = $1 WHERE id = $2 RETURNING *',
    [status, invite.id],
  )
  return JSON.parse(JSON.stringify(updateRows[0])) // dates as strings, like API responses
}

const createPopulatedProject = async (app: Application, token: string) => {
  const project = await createTestProject(app, token, 'projy')

  // create 3 issues, 2 'open'
  const issues: Issue[] = await Promise.all([
    createTestIssue(app, token, project.id, 'i1', undefined, 'BACKLOG'), // BACKLOG considered 'open'
    createTestIssue(app, token, project.id, 'i2', undefined, 'IN_PROGRESS'), // IN_PROGRESS considered 'open'
    createTestIssue(app, token, project.id, 'i3', undefined, 'DONE'), // DONE not considered 'open'
  ])

  // add 2 contributors
  const contributorAccounts: User[] = await Promise.all([
    createTestUser('c1@test.kac'),
    createTestUser('c2@test.kac'),
  ])
  for (const user of contributorAccounts)
    await makeContributor(user.id, project.id)

  // add 2 pending invite recipients
  const inviteeAccounts: User[] = await Promise.all([
    createTestUser('inv1@test.kac'),
    createTestUser('inv2@test.kac'),
  ])
  const pendingInvites: Invite[] = await Promise.all([
    createInvite(app, token, inviteeAccounts[0].id, project.id),
    createInvite(app, token, inviteeAccounts[1].id, project.id),
  ])

  // 1 rejected invite recipient
  const reject = await createTestUser('reject@test.kac')
  await createInvite(app, token, reject.id, project.id, 'REJECTED')

  return {
    project,
    issues,
    contributorAccounts,
    inviteeAccounts,
    pendingInvites,
  }
}

export {
  createTestUser,
  createTestProfile,
  setUsername,
  createTestProject,
  makeContributor,
  removeContributor,
  createTestIssue,
  createTestComment,
  createInvite,
  createPopulatedProject,
}

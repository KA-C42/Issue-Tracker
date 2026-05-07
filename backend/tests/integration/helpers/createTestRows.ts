import request from 'supertest'
import type { Application } from 'express'
import {
  Profile,
  Project,
  ProjectContributor,
  Issue,
  Comment,
  Invitation,
  User,
} from '../../../src/types/db'
import { IssueStatus } from '../../../src/types/enums'
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
    .patch(`/profiles/${id}`)
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
  name: string = 'testProject',
  code: string = 'PROJ',
  description: string = 'project for dev testing only',
): Promise<Project> => {
  const response = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: name,
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
  author_id: string,
  issue_id: string,
  comment: string = 'blah blah blahbalh',
): Promise<Comment> => {
  const response = await request(app)
    .post(`/issues/${issue_id}/comments`)
    .send({
      author_id: author_id,
      comment: comment,
    })
    .expect(201)

  return response.body as Comment
}

const createInvitation = async (
  app: Application,
  sender_id: string,
  receiver_id: string,
  project_id: string,
): Promise<Invitation> => {
  const response = await request(app)
    .post(`/projects/${project_id}/invitations`)
    .send({
      sender_id: sender_id,
      receiver_id: receiver_id,
    })
    .expect(201)

  return response.body as Invitation
}

export {
  createTestUser,
  createTestProfile,
  setUsername,
  createTestProject,
  makeContributor,
  createTestIssue,
  createTestComment,
  createInvitation,
}

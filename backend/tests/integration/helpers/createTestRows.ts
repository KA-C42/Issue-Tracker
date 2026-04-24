import request from 'supertest'
import type { Application } from 'express'
import {
  User,
  Project,
  ProjectContributor,
  Issue,
  Comment,
  Invitation,
} from '../../../src/db/types/db'
import { IssueStatus } from '../../../src/db/types/enums'

const createTestUser = async (
  app: Application,
  username: string = 'testUser',
): Promise<User> => {
  const response = await request(app)
    .post('/users')
    .send({ username: username })
    .expect(201)

  return {
    id: response.body.id,
    username: response.body.username,
  } as User
}

const createTestProject = async (
  app: Application,
  owner_id: string,
  name: string = 'testProject',
  code: string = 'PROJ',
  description: string = 'project for dev testing only',
): Promise<Project> => {
  const response = await request(app)
    .post('/projects')
    .send({
      name: name,
      description: description,
      owner_id: owner_id,
      code: code,
    })
    .expect(201)

  return response.body as Project
}

const makeContributor = async (
  app: Application,
  user_id: string,
  project_id: string,
): Promise<ProjectContributor> => {
  const response = await request(app)
    .post('/project-contributors')
    .send({
      user_id: user_id,
      project_id: project_id,
    })
    .expect(201)

  return response.body as ProjectContributor
}

const createTestIssue = async (
  app: Application,
  creator_id: string,
  project_id: string,
  title: string = 'issue',
  assignee_id: string | undefined = undefined,
  status?: IssueStatus,
): Promise<Issue> => {
  const response = await request(app)
    .post(`/projects/${project_id}/issues`)
    .send({
      creator_id: creator_id,
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
  createTestProject,
  makeContributor,
  createTestIssue,
  createTestComment,
  createInvitation,
}

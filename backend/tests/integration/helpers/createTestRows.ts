import request from 'supertest'
import type { Application } from 'express'
import { IssueStatus } from '../../../src/types/enums'

type user = {
  id: string
  username: string
}

type project = {
  id: string
  name: string
  description: string
  owner_id: string
  modified_at: string
}

type projectContributor = {
  user_id: string
  project_id: string
  joined_at: string
}

type issue = {
  id: string
  creator_id: string
  project_id: string
  title: string
  code: number
  details?: string
  status: IssueStatus
  assignee_id?: string
  status_changed_at: string
  modified_at: string
  created_at: string
}

const createTestUser = async (
  app: Application,
  username: string = 'testUser',
): Promise<user> => {
  const response = await request(app)
    .post('/users')
    .send({ username: username })
    .expect(201)

  return {
    id: response.body.id,
    username: response.body.username,
  } as user
}

const createTestProject = async (
  app: Application,
  owner_id: string,
  name: string = 'testProject',
  code: string = 'PROJ',
  description: string = 'project for dev testing only',
): Promise<project> => {
  const response = await request(app)
    .post('/projects')
    .send({
      name: name,
      description: description,
      owner_id: owner_id,
      code: code,
    })
    .expect(201)

  return response.body as project
}

const makeContributor = async (
  app: Application,
  user_id: string,
  project_id: string,
): Promise<projectContributor> => {
  const response = await request(app)
    .post('/project-contributors')
    .send({
      user_id: user_id,
      project_id: project_id,
    })
    .expect(201)

  return response.body as projectContributor
}

const createTestIssue = async (
  app: Application,
  creator_id: string,
  project_id: string,
  title: string = 'issue',
  assignee_id: string | undefined = undefined,
  status?: string,
): Promise<issue> => {
  const response = await request(app)
    .post(`/projects/${project_id}/issues`)
    .send({
      creator_id: creator_id,
      title: title,
      assignee_id: assignee_id,
      status: status,
    })
    .expect(201)

  return response.body as issue
}

export { createTestUser, createTestProject, makeContributor, createTestIssue }

export type { user, project, issue }

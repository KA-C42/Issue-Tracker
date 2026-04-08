import request from 'supertest'
import type { Application } from 'express'

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
  description: string = 'project for dev testing only',
): Promise<project> => {
  const response = await request(app)
    .post('/projects')
    .send({
      name: name,
      description: description,
      owner_id: owner_id,
    })
    .expect(201)

  return response.body as project
}

export { createTestUser, createTestProject }

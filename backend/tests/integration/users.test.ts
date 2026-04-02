import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'

describe('/users', () => {
  it('creates a new user with status 201, returning the new row', async () => {
    const app = createApp()

    const payload = {
      username: 'nameyName',
    }

    const response = await request(app)
      .post('/users')
      .send(payload)
      .expect(201)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject(payload)
  })

  it('rejects new user request missing a username with status 400', async () => {
    const app = createApp()

    const response = await request(app)
      .post('/users')
      .expect(400)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('MISSING_USERNAME')
  })

  it('rejects a username with status 409 if the username is already in use', async () => {
    const app = createApp()

    const payload = {
      username: 'usedAgain',
    }

    // make username unavailable
    await request(app).post('/users').send(payload).expect(201)

    const response = await request(app)
      .post('/users')
      .send(payload)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USERNAME_CONFLICT')
  })

  it('retrieves a user row by id with status 200', async () => {
    const app = createApp()

    const payload = {
      username: 'IDmePlease',
    }

    // create user to test/retrieve
    const created = await request(app).post('/users').send(payload).expect(201)

    const response = await request(app)
      .get(`/users/${created.body.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      ...payload,
      id: created.body.id,
    })
  })

  it('rejects a request for nonexistent user with status 404', async () => {
    const app = createApp()

    const response = await request(app)
      .get(`/users/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('rejects a username change with status 409 if the username is already in use', async () => {
    const app = createApp()

    const conflictingUsername = {
      username: 'usernameTaken',
    }

    // make username unavailable
    await request(app).post('/users').send(conflictingUsername).expect(201)

    const changingUser = await request(app)
      .post('/users')
      .send({ username: 'uncleverID' })
      .expect(201)

    const response = await request(app)
      .patch(`/users/${changingUser.body.id}`)
      .send(conflictingUsername)
      .expect(409)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USERNAME_CONFLICT')
  })

  it('successfully changes a users username with status 200', async () => {
    const app = createApp()

    const changingUser = await request(app)
      .post('/users')
      .send({ username: 'uncleverName' })
      .expect(201)

    const payload = {
      username: 'clevererName',
    }

    const response = await request(app)
      .patch(`/users/${changingUser.body.id}`)
      .send(payload)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject({
      ...payload,
      id: changingUser.body.id,
    })
  })

  it('rejects a request to modify a nonexistent user with status 404', async () => {
    const app = createApp()

    const payload = {
      username: 'nullUser',
    }

    const response = await request(app)
      .patch(`/users/${crypto.randomUUID()}`)
      .send(payload)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it('soft deletes a user by setting the deactivated_at field with status 200', async () => {
    const app = createApp()

    const toDelete = await request(app)
      .post('/users')
      .send({ username: 'unmakeMe' })
      .expect(201)

    const deleted = await request(app)
      .delete(`/users/${toDelete.body.id}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(deleted.body.deactivated_at).toBeTruthy()
  })

  it('rejects a request to delete a nonexistent user with status 404', async () => {
    const app = createApp()

    const response = await request(app)
      .delete(`/users/${crypto.randomUUID()}`)
      .expect(404)
      .expect('Content-Type', /json/)

    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })
})

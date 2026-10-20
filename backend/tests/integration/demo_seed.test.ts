import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'node:crypto'
import request from 'supertest'
import createApp from '../../src/api/app.js'
import { pool } from '../../src/db/pool.js'
import { createTestUser } from './helpers/createTestRows.js'
import { createAuthToken } from './helpers/createAuthToken.js'
import { Application } from 'express'
import {
  createCommentSchema,
  createIssueSchema,
  projectSchema,
  usernameSchema,
} from '@issue-tracker/shared'

// the auth.users row Supabase inserts on signInAnonymously(),
// which is what fires the seed trigger
const createAnonymousUser = async (): Promise<string> => {
  const text =
    'INSERT INTO auth.users (id, is_anonymous) VALUES ($1, true) RETURNING id'
  const values = [crypto.randomUUID()]

  const result = await pool.query(text, values)
  return result.rows[0].id
}

describe('seed_demo_workspace trigger', () => {
  let app: Application
  let guestId: string
  let guestToken: string
  let guestUsername: string

  beforeEach(async () => {
    app = createApp()
    guestId = await createAnonymousUser()
    guestToken = await createAuthToken(guestId)

    const { body: profile } = await request(app)
      .get('/me/profile')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
    guestUsername = profile.username
  })

  it('names the guest like coolCat42 and each teammate after the guest', async () => {
    const text = `
      SELECT g.username AS guest, m.username AS maya,
        s.username AS sam, j.username AS jamie
      FROM demo.sandboxes sb
      JOIN profiles g ON g.id = sb.guest_id
      JOIN profiles m ON m.id = sb.maya_id
      JOIN profiles s ON s.id = sb.sam_id
      JOIN profiles j ON j.id = sb.jamie_id
    `
    const result = await pool.query(text)

    expect(guestUsername).toMatch(/^[a-z]+[A-Z][a-z]+\d{2}$/)
    // one sandbox row, and each id in it joins to a real profile
    expect(result.rows).toEqual([
      {
        guest: guestUsername,
        maya: `maya_${guestUsername}`,
        sam: `sam_${guestUsername}`,
        jamie: `jamie_${guestUsername}`,
      },
    ])
  })

  it('gives the guest one owned project, with an invite to revoke', async () => {
    const response = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    // SITE-1's comments send the guest to Members to revoke maya's invite
    expect(response.body).toMatchObject([
      {
        title: 'Portfolio Website',
        code: 'SITE',
        open_issue_count: 2,
        member_count: 2,
        pending_invite_count: 1,
      },
    ])
  })

  it("makes the guest a contributor on maya's project, with one issue to drag", async () => {
    const response = await request(app)
      .get('/me/projects/contributing')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    // Hire Kacy joins this list only after the guest accepts its invite
    expect(response.body).toMatchObject([
      {
        title: 'Mobile App Launch',
        code: 'LNCH',
        creator_username: `maya_${guestUsername}`,
        assigned_open_issue_count: 1,
      },
    ])
  })

  it('leaves one pending Hire Kacy invite on the dashboard', async () => {
    const response = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
      .expect('Content-Type', /json/)

    expect(response.body).toMatchObject([
      {
        recipient_id: guestId,
        status: 'PENDING',
        sender_username: `sam_${guestUsername}`,
        project_title: 'Hire Kacy',
      },
    ])
  })

  it('only seeds rows the shared schemas would accept', async () => {
    const projects = await pool.query('SELECT * FROM projects')
    const issues = await pool.query('SELECT * FROM issues')
    const comments = await pool.query('SELECT * FROM comments')
    const profiles = await pool.query('SELECT * FROM profiles')

    expect(projects.rows).toHaveLength(3)
    expect(issues.rows).toHaveLength(9)
    expect(comments.rows).toHaveLength(21)
    expect(profiles.rows).toHaveLength(4)

    // the seed is raw SQL, so this is the first time these schemas see its rows
    for (const project of projects.rows) {
      expect(() => projectSchema.parse(project)).not.toThrow()
    }
    for (const issue of issues.rows) {
      expect(() => createIssueSchema.parse(issue)).not.toThrow()
    }
    for (const comment of comments.rows) {
      expect(() => createCommentSchema.parse(comment)).not.toThrow()
    }
    for (const profile of profiles.rows) {
      expect(() => usernameSchema.parse(profile)).not.toThrow()
    }
  })

  it('does not seed anything for regular sign-ups', async () => {
    const user = await createTestUser('regular@test.kac')
    const token = await createAuthToken(user.id)

    const owned = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const invites = await request(app)
      .get('/me/invites')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(owned.body).toEqual([])
    expect(invites.body).toEqual([])

    // only the guest from beforeEach has a sandbox
    const sandboxes = await pool.query('SELECT guest_id FROM demo.sandboxes')
    expect(sandboxes.rows).toEqual([{ guest_id: guestId }])
  })

  it('gives each guest a separate workspace', async () => {
    const otherGuestId = await createAnonymousUser()
    const otherToken = await createAuthToken(otherGuestId)

    const mine = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
    const theirs = await request(app)
      .get('/me/projects/owned')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200)

    expect(mine.body).toHaveLength(1)
    expect(theirs.body).toHaveLength(1)
    expect(theirs.body[0].id).not.toBe(mine.body[0].id)
  })
})

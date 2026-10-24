import { describe, it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { pool } from '../../../src/db/pool'

// Signing up an anonymous user fires the seed trigger, like the Try-demo button
const createGuest = async () => {
  const guest = randomUUID()
  await pool.query(
    'INSERT INTO auth.users (id, is_anonymous) VALUES ($1, true)',
    [guest],
  )
  return guest
}

const rowCounts = async () => {
  const counts: Record<string, number> = {}
  for (const table of [
    'profiles',
    'projects',
    'project_contributors',
    'issues',
    'comments',
    'invites',
  ]) {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${table}`)
    counts[table] = rows[0].n
  }
  return counts
}

describe('demo workspace', () => {
  it('gives a new guest an owned project, a contributing project and an invite', async () => {
    const guest = await createGuest()

    const owned = await pool.query(
      'SELECT id FROM projects WHERE creator_id = $1',
      [guest],
    )
    const memberships = await pool.query(
      'SELECT project_id FROM project_contributors WHERE user_id = $1',
      [guest],
    )
    const invites = await pool.query(
      'SELECT id FROM invites WHERE recipient_id = $1',
      [guest],
    )

    expect(owned.rows).toHaveLength(1)
    expect(memberships.rows).toHaveLength(2) // owned + contributing
    expect(invites.rows).toHaveLength(1)
  })

  it('is removed completely when its users are deleted', async () => {
    await createGuest()

    // db data resets between tests
    // demo user's data should be all there is
    await pool.query('DELETE FROM auth.users')

    expect(await rowCounts()).toEqual({
      profiles: 0,
      projects: 0,
      project_contributors: 0,
      issues: 0,
      comments: 0,
      invites: 0,
    })
  })

  it("survives deleting one teammate, keeping the teammate's issue", async () => {
    await createGuest()
    // Sam created this issue in the guest's own project
    const {
      rows: [issue],
    } = await pool.query(
      "SELECT id, creator_id FROM issues WHERE title = 'Lazy-load hero images'",
    )

    await pool.query('DELETE FROM auth.users WHERE id = $1', [issue.creator_id])

    const { rows } = await pool.query(
      'SELECT creator_id FROM issues WHERE id = $1',
      [issue.id],
    )
    expect(rows).toEqual([{ creator_id: null }])
  })

  it('still blocks removing a project owner directly', async () => {
    const guest = await createGuest()
    const {
      rows: [project],
    } = await pool.query('SELECT id FROM projects WHERE creator_id = $1', [
      guest,
    ])

    await expect(
      pool.query(
        'DELETE FROM project_contributors WHERE project_id = $1 AND user_id = $2',
        [project.id, guest],
      ),
    ).rejects.toThrow('CANNOT_REMOVE_OWNER')
  })
})

import { describe, it, expect } from 'vitest'
import { pool } from '../../../src/db/pool'

const insertUser = (id: string) =>
  pool.query('INSERT INTO auth.users (id) VALUES ($1)', [id])

const usernameFor = async (id: string) => {
  const { rows } = await pool.query(
    'SELECT username FROM profiles WHERE id = $1',
    [id],
  )
  return rows[0]?.username as string | undefined
}

describe('create_new_user_profile trigger', () => {
  it('names the profile user_ plus the first 6 characters of the id', async () => {
    const id = '12345678-0000-0000-0000-000000000000'
    await insertUser(id)

    expect(await usernameFor(id)).toBe('user_123456')
  })

  it('slides one character over when the name is taken', async () => {
    const a = 'abcdef00-0000-0000-0000-000000000000'
    const b = 'abcdef11-0000-0000-0000-000000000000' // same first 6 characters as A
    await insertUser(a)
    await insertUser(b)

    expect(await usernameFor(a)).toBe('user_abcdef') // A wasn't renamed (the old bug)
    expect(await usernameFor(b)).toBe('user_bcdef1')
  })

  it('gives up when every window is taken', async () => {
    await insertUser('000000ff-0000-0000-0000-000000000000') // takes user_000000
    const allZeros = '00000000-0000-0000-0000-000000000000' // every window is 000000

    await expect(insertUser(allZeros)).rejects.toThrow(
      'could not generate a unique username',
    )
  })
})

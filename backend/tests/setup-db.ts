import { vi, beforeEach, beforeAll } from 'vitest'
import { pool } from '../src/db/pool'
import { createRemoteJWKSet } from 'jose'
import {
  getTestJwks,
  setupTestKeys,
} from './integration/helpers/createAuthToken'

vi.mock(import('jose'), async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    createRemoteJWKSet: vi.fn(),
  }
})

beforeAll(async () => {
  await setupTestKeys()

  vi.mocked(createRemoteJWKSet).mockReturnValue(
    getTestJwks() as ReturnType<typeof createRemoteJWKSet>,
  )
})

beforeEach(async () => {
  await pool.query(
    'TRUNCATE comments, issues, project_contributors, projects, profiles, auth.users CASCADE',
  )
})

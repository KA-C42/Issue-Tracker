import { beforeEach } from 'vitest'
import { pool } from '../src/db/pool'

beforeEach(async () => {
  await pool.query(
    'TRUNCATE comments, issues, project_contributors, projects, profiles, auth.users CASCADE',
  )
})

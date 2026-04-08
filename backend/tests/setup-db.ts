import { beforeEach } from 'vitest'
import { pool } from '../src/db/pool'

beforeEach(async () => {
  await pool.query('TRUNCATE projects, users CASCADE')
})

import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL not found')
}

export const pool = new Pool({
  connectionString: connectionString,
})

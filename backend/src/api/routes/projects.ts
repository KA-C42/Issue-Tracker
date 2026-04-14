import { Router } from 'express'
import { pool } from '../../db/pool.js'
import { AppError } from '../errors/AppError.js'
import type { DbError } from '../errors/DbError.js'

const projectRouter = Router()

// Create new project
projectRouter.post('/', async (req, res) => {
  if (!req.body.owner_id) {
    throw new AppError('MISSING_OWNER_ID')
  }

  if (!req.body.name) {
    throw new AppError('MISSING_PROJECT_NAME')
  }

  if (!req.body.code) {
    throw new AppError('MISSING_PROJECT_CODE')
  }

  const text =
    'INSERT INTO projects (name, description, owner_id, code) VALUES ($1, $2, $3, $4) RETURNING *'
  const values = [
    req.body.name,
    req.body.description ?? null,
    req.body.owner_id,
    req.body.code,
  ]

  try {
    const result = await pool.query(text, values)
    res.status(201).json(result.rows[0])
  } catch (err) {
    const dbError = err as DbError
    console.log(dbError)
    if (
      dbError.code === '23514' &&
      dbError.constraint === 'projects_code_check'
    ) {
      throw new AppError('INVALID_CODE')
    }
    if (
      dbError.code === '23505' &&
      dbError.constraint === 'projects_owner_id_name_key'
    ) {
      throw new AppError('PROJECT_NAME_CONFLICT')
    }
    throw err
  }
})

// Get existing project
projectRouter.get('/:id', async (req, res) => {
  const text = 'SELECT * FROM projects WHERE id = $1'
  const values = [req.params.id]
  const result = await pool.query(text, values)

  if (result.rowCount === 0) {
    throw new AppError('PROJECT_NOT_FOUND')
  }

  res.status(200).json(result.rows[0])
})

// Get projects by owner_id
projectRouter.get('/', async (req, res) => {
  if (!req.query.owner_id) {
    throw new AppError('MISSING_OWNER_ID')
  }

  const text = 'SELECT * FROM projects WHERE owner_id = $1'
  const values = [req.query.owner_id] // /projects?owner_id=###
  const result = await pool.query(text, values)

  res.status(200).json(result.rows)
})

projectRouter.patch('/:id', async (req, res) => {
  if (!req.body) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }

  const fields = []
  const values = []
  let i = 1

  if (req.body.name !== undefined) {
    fields.push(`name = $${i++}`)
    values.push(req.body.name)
  }

  if (req.body.description !== undefined) {
    fields.push(`description = $${i++}`)
    values.push(req.body.description)
  }

  if (req.body.code !== undefined) {
    fields.push(`code = $${i++}`)
    values.push(req.body.code)
  }

  if (fields.length === 0) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }

  values.push(req.params.id)

  const text = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = $${i}
    RETURNING *
    `

  const result = await pool.query(text, values)

  if (result.rowCount === 0) {
    throw new AppError('PROJECT_NOT_FOUND')
  }

  res.status(200).json(result.rows[0])
})

projectRouter.delete('/:id', async (req, res) => {
  const text = `
    DELETE FROM projects
    WHERE id = $1
    RETURNING *
    `

  const values = [req.params.id]
  const result = await pool.query(text, values)

  if (result.rowCount === 0) {
    throw new AppError('PROJECT_NOT_FOUND')
  }

  res.status(204).send()
})

export default projectRouter

import type { Response } from 'express'
import { AppError } from '../errors/AppError.js'
import type { UpdateProjectInput } from '@issue-tracker/shared'

function buildProjectPatchQuery(data: UpdateProjectInput) {
  const { id, body } = data

  const fields = []
  const values = []
  let i = 1

  for (const [field, value] of Object.entries(body)) {
    fields.push(`${field} = $${i++}`)
    values.push(value)
  }

  values.push(id)

  const text = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = $${i}
    RETURNING *
    `

  return { text, values }
}

export { buildProjectPatchQuery }

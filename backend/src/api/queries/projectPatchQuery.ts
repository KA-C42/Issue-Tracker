import { AppError } from '../errors/AppError.js'

type projectPatchReqBody = {
  name?: string
  description?: string
  code?: string
}

function buildProjectPatchQuery(
  req: projectPatchReqBody,
  id: string,
): [string, string[]] {
  const fields = []
  const values = []
  let i = 1

  if (req.name !== undefined) {
    fields.push(`name = $${i++}`)
    values.push(req.name)
  }

  if (req.description !== undefined) {
    fields.push(`description = $${i++}`)
    values.push(req.description)
  }

  if (req.code !== undefined) {
    fields.push(`code = $${i++}`)
    values.push(req.code)
  }

  if (fields.length === 0) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }

  values.push(id)

  const text = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = $${i}
    RETURNING *
    `

  return [text, values]
}

export { buildProjectPatchQuery }
export type { projectPatchReqBody }

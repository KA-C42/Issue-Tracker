import type { IssueStatus } from '../../types/enums.js'
import { AppError } from '../errors/AppError.js'

type issuePostFields = {
  creator_id: string
  title: string
  details?: string
  status?: string
  assignee_id?: string
  project_id: string
}

type issuePatchFields = {
  title?: string
  details?: string
  status?: IssueStatus
  assignee_id?: string | null
}

function buildIssuePostQuery(body: issuePostFields) {
  const fields = []
  const values = []
  let i = 1
  const valuesNumberList = []

  fields.push(`creator_id`)
  values.push(body.creator_id)
  valuesNumberList.push(i++)

  fields.push(`project_id`)
  values.push(body.project_id)
  valuesNumberList.push(i++)

  fields.push(`title`)
  values.push(body.title)
  valuesNumberList.push(i++)

  if (body.details !== undefined) {
    fields.push(`details`)
    values.push(body.details)
    valuesNumberList.push(i++)
  }

  if (body.status !== undefined) {
    fields.push(`status`)
    values.push(body.status)
    valuesNumberList.push(i++)
  }

  if (body.assignee_id !== undefined) {
    fields.push(`assignee_id`)
    values.push(body.assignee_id)
    valuesNumberList.push(i++)
  }

  if (fields.length === 0) {
    throw new AppError('NO_PROJECT_FIELDS_PROVIDED')
  }

  const text = `INSERT INTO issues (${fields.join(', ')}) VALUES ($${valuesNumberList.join(', $')}) RETURNING *`

  return { text, values }
}

function buildIssueGetQuery(
  project_id: string | undefined,
  assignee_id: string | undefined,
  status: IssueStatus | undefined,
) {
  const searchParameters: string[] = []
  const values: string[] = []
  if (project_id) {
    searchParameters.push('project_id')
    values.push(project_id)
  }
  if (assignee_id) {
    searchParameters.push('assignee_id')
    values.push(assignee_id)
  }
  if (status) {
    searchParameters.push('status')
    values.push(status)
  }

  let i = 1
  const conditions = searchParameters.map((param) => `${param} = $${i++}`)
  const text = `
    SELECT * FROM issues 
    WHERE ${conditions.join(' AND ')}
    ORDER BY CASE status 
      WHEN 'BACKLOG' THEN 1
      WHEN 'IN_PROGRESS' THEN 2
      WHEN 'DONE' THEN 3
    END, modified_at
    `

  return { text, values }
}

function buildIssuePatchQuery(id: string | undefined, body: issuePatchFields) {
  const fields = []
  const values = []
  let i = 1

  if (body.title !== undefined) {
    fields.push(`title = $${i++}`)
    values.push(body.title)
  }

  if (body.details !== undefined) {
    fields.push(`details = $${i++}`)
    values.push(body.details)
  }

  if (body.status !== undefined) {
    fields.push(`status = $${i++}`)
    values.push(body.status)
  }

  if (body.assignee_id !== undefined) {
    fields.push(`assignee_id = $${i++}`)
    values.push(body.assignee_id)
  }

  if (fields.length === 0) {
    throw new AppError('NO_ISSUE_FIELDS_PROVIDED')
  }

  values.push(id)

  const text = `
    UPDATE issues
    SET ${fields.join(', ')}
    WHERE id = $${i}
    RETURNING *
    `

  return { text, values }
}

export { buildIssuePostQuery, buildIssueGetQuery, buildIssuePatchQuery }
export type { issuePostFields, issuePatchFields }

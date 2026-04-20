import type { IssueStatus } from '../../types/enums.js'

type issuePostFields = {
  creator_id: string
  title: string
  details?: string
  status?: string
  assignee_id?: string
  project_id: string
}

function buildIssuePostQuery(body: issuePostFields) {
  const fields = []
  const values = []
  let i = 1
  const valuesNumberList = []

  for (const [key, value] of Object.entries(body)) {
    fields.push(key)
    values.push(value)
    valuesNumberList.push(i++)
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

export { buildIssuePostQuery, buildIssueGetQuery }
export type { issuePostFields }

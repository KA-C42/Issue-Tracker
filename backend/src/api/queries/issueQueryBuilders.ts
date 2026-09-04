import type {
  UpdateIssueInput,
  IssueStatus,
  CreateIssueInput,
} from '@issue-tracker/shared'

function buildIssuePostQuery(creatorId: string, content: CreateIssueInput) {
  const body = {
    creator_id: creatorId,
    ...content,
  }

  const fields = []
  const values = []
  let i = 1
  const valuesNumberList = []

  for (const [field, value] of Object.entries(body)) {
    fields.push(`${field}`)
    values.push(value)
    valuesNumberList.push(i++)
  }

  const text = `INSERT INTO issues (${fields.join(', ')}) VALUES ($${valuesNumberList.join(', $')}) RETURNING *`

  return { text, values }
}

function buildIssueGetQuery(
  user_id: string,
  project_id: string | undefined,
  assignee_id: string | undefined,
  status: IssueStatus | undefined,
) {
  const searchParameters: string[] = []
  const values: string[] = []
  if (project_id) {
    searchParameters.push('project_id')
    values.push(project_id)
    if (assignee_id) {
      searchParameters.push('assignee_id')
      values.push(assignee_id)
    }
  } else {
    searchParameters.push('assignee_id')
    values.push(user_id)
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

function buildIssuePatchQuery(data: UpdateIssueInput) {
  const { id, ...body } = data

  const fields = []
  const values = []
  let i = 1

  for (const [field, value] of Object.entries(body)) {
    fields.push(`${field} = $${i++}`)
    values.push(value)
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

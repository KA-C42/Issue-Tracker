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

export { buildIssuePostQuery }
export type { issuePostFields }

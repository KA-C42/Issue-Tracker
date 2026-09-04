function buildInviteGetQuery(
  project_id: string | undefined,
  recipient_id: string | undefined,
) {
  let field: string | undefined
  const values = []

  if (project_id) {
    field = 'project_id'
    values.push(project_id)
  } else if (recipient_id) {
    field = 'recipient_id'
    values.push(recipient_id)
  }

  const text = `SELECT * FROM invites WHERE ${field} = $1 ORDER BY status ASC, sent_at DESC`

  return { text, values }
}

export { buildInviteGetQuery }

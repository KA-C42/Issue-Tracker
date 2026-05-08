function buildInviteGetQuery(
  project_id: string | undefined,
  receiver_id: string | undefined,
) {
  let field: string | undefined
  const values = []

  if (project_id) {
    field = 'project_id'
    values.push(project_id)
  } else if (receiver_id) {
    field = 'receiver_id'
    values.push(receiver_id)
  }

  const text = `SELECT * FROM invitations WHERE ${field} = $1 ORDER BY status ASC, sent_at DESC`

  return { text, values }
}

export { buildInviteGetQuery }

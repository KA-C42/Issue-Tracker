function buildInviteGetQuery(project_id: string, receiver_id: string) {
  let field
  const values = []

  if (project_id) {
    field = 'project_id'
    values.push(project_id)
  } else if (receiver_id) {
    field = 'receiver_id'
    values.push(receiver_id)
  }

  const text = `SELECT * FROM invitations WHERE ${field} = $1 ORDER BY status`

  return { text, values }
}

export { buildInviteGetQuery }

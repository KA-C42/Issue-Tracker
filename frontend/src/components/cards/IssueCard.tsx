import type { Issue } from '@issue-tracker/shared'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Link } from 'react-router-dom'

export default function IssueCard(data: Issue) {
  return (
    <Link
      to={`/projects/${data.project_id}/issues/${data.id}`}
      draggable={false}
    >
      <Card>
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.details ? data.details : 'No description'}
        </CardContent>
      </Card>
    </Link>
  )
}

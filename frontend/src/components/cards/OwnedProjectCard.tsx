import type { Project } from '@issue-tracker/shared'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Link } from 'react-router-dom'

export default function OwnedProjectCard(data: Project) {
  return (
    <Link to={`/asd`}>
      <Card>
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.description ? data.description : 'No description'}
        </CardContent>
      </Card>
    </Link>
  )
}

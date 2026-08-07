import type { Project } from '@/types/db'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Link } from 'react-router-dom'

export default function OwnedProjectCard(data: Project) {
  return (
    <Link to={`/asd`}>
      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.description ? data.description : 'No description'}
        </CardContent>
      </Card>
    </Link>
  )
}

import type { ContributingProjectSummary } from '@issue-tracker/shared'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Link } from 'react-router-dom'
import { plural } from '../../lib/utils'

export default function ContributingProjectCard(
  data: ContributingProjectSummary,
) {
  return (
    <Link to={`/projects/${data.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="truncate">{data.title}</CardTitle>
          <CardAction>
            <Badge variant="secondary" className="font-mono">
              {data.code}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>by {data.creator_username}</span>
          <span>
            {plural(data.assigned_open_issue_count, 'open issue')} assigned to
            you
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}

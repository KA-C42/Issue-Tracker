import type { OwnedProjectSummary } from '@issue-tracker/shared'
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Link } from 'react-router-dom'
import { plural } from '../../lib/utils'

export default function OwnedProjectCard(data: OwnedProjectSummary) {
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
          <span>{plural(data.open_issue_count, 'open issue')}</span>
          <span>{plural(data.member_count, 'member')}</span>
          <span>{plural(data.pending_invite_count, 'pending invite')}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}

import type { Issue } from '@issue-tracker/shared'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { singleProjectQueryOptions } from '@/api/projects'
import { Username } from '@/components/Username'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'

export default function IssueCard(issue: Issue) {
  // ProjectPage already loaded this project, so this reads from the cache
  const { data: project } = useQuery(
    singleProjectQueryOptions(issue.project_id),
  )

  return (
    <Link
      to={`/projects/${issue.project_id}/issues/${issue.id}`}
      draggable={false}
    >
      <Card size="sm">
        {/* pr-6 keeps text clear of the drag handle in the top-right corner */}
        <CardHeader className="pr-6">
          <CardDescription className="font-mono">
            {project ? `${project.code}-${issue.code}` : `#${issue.code}`}
          </CardDescription>
          <CardTitle className="line-clamp-2">{issue.title}</CardTitle>
        </CardHeader>
        <CardFooter className="text-muted-foreground">
          {issue.assignee_id ? (
            <Username userId={issue.assignee_id} />
          ) : (
            'Unassigned'
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}

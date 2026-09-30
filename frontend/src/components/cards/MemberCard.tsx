import type { ProjectMember } from '@issue-tracker/shared'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'

export default function MemberCard(member: ProjectMember) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{member.username}</CardTitle>
        <CardDescription>
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

import type { PendingInvite } from '@issue-tracker/shared'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'

export default function InviteCard(invite: PendingInvite) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{invite.recipient_username}</CardTitle>
        <CardDescription>
          Invited by {invite.sender_username} on{' '}
          {new Date(invite.sent_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

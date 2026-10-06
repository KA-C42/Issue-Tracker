import type { PendingSentInvite, Project } from '@issue-tracker/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Button } from '../ui/button'
import { projectInvitesQueryOptions, revokeInvite } from '@/api/invites'
import { canRevokeInvite } from '@/lib/permissions'
import { useAuthProtected } from '@/auth/UseAuth'
import { ApiError } from '@/api/apiError'

export default function SentInviteCard({
  project,
  ...invite
}: PendingSentInvite & { project: Project }) {
  const { user } = useAuthProtected()
  const queryClient = useQueryClient()

  const inviteRevoke = useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      toast.success(`Invite to '${invite.recipient_username}' revoked`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectInvitesQueryOptions(project.id).queryKey,
      })
    },
  })

  const canRevoke = canRevokeInvite(user.id, invite, project)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{invite.recipient_username}</CardTitle>
        <CardDescription>
          Invited by {invite.sender_username} on{' '}
          {new Date(invite.sent_at).toLocaleDateString()}
        </CardDescription>
        {canRevoke && (
          <CardAction>
            <Button
              variant="ghost"
              size="xs"
              disabled={inviteRevoke.isPending}
              onClick={() => inviteRevoke.mutate(invite.id)}
            >
              Revoke
            </Button>
          </CardAction>
        )}
      </CardHeader>
    </Card>
  )
}

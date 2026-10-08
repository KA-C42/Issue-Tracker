import type { PendingReceivedInvite } from '@issue-tracker/shared'
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
import { receivedInvitesQueryOptions, respondToInvite } from '@/api/invites'
import { ApiError } from '@/api/apiError'
import { projectsQueryOptions } from '@/api/projects'

const RESPONSE_LABELS = { ACCEPTED: 'accepted', REJECTED: 'declined' } as const

export default function ReceivedInviteCard(invite: PendingReceivedInvite) {
  const queryClient = useQueryClient()

  const respond = useMutation({
    mutationFn: respondToInvite,
    onSuccess: (_data, variables) => {
      toast.success(
        `Invite to '${invite.project_title}' ${RESPONSE_LABELS[variables.response]}`,
      )
      return queryClient.invalidateQueries({
        queryKey: projectsQueryOptions.queryKey,
      })
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
    // runs after errors too: a 409 means the invite is gone, so drop its card
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: receivedInvitesQueryOptions.queryKey,
      }),
  })

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{invite.project_title}</CardTitle>
        <CardDescription>
          Invited by {invite.sender_username} on{' '}
          {new Date(invite.sent_at).toLocaleDateString()}
        </CardDescription>

        <CardAction>
          <Button
            variant="default"
            size="xs"
            disabled={respond.isPending}
            onClick={() =>
              respond.mutate({ inviteId: invite.id, response: 'ACCEPTED' })
            }
          >
            Accept
          </Button>

          <Button
            variant="ghost"
            size="xs"
            disabled={respond.isPending}
            onClick={() =>
              respond.mutate({ inviteId: invite.id, response: 'REJECTED' })
            }
          >
            Decline
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}

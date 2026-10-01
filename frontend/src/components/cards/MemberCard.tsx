import { useState } from 'react'
import type { Project, ProjectMember } from '@issue-tracker/shared'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Spinner } from '../ui/spinner'
import {
  deleteProjectContributor,
  projectContributorsQueryOptions,
} from '@/api/contributors'
import { projectIssuesQueryOptions } from '@/api/issues'
import { canRemoveContributor } from '@/lib/permissions'
import { useAuthProtected } from '@/auth/UseAuth'
import { ApiError } from '@/api/apiError'

export default function MemberCard({
  project,
  ...member
}: ProjectMember & { project: Project }) {
  const { user } = useAuthProtected()
  const queryClient = useQueryClient()
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const memberRemove = useMutation({
    mutationFn: deleteProjectContributor,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectContributorsQueryOptions(project.id).queryKey,
      })
      // the removed member's issues were unassigned
      queryClient.invalidateQueries({
        queryKey: projectIssuesQueryOptions(project.id).queryKey,
      })
      toast.success(`'${member.username}' removed from project`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const isCreator = member.user_id === project.creator_id
  const isSelf = member.user_id === user.id
  const tags = [isCreator && 'Creator', isSelf && 'You'].filter(Boolean)
  const canRemove = canRemoveContributor(user.id, project, member.user_id)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {member.username}
          {tags.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {tags.join(' · ')}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </CardDescription>
        {canRemove && (
          <CardAction>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowRemoveConfirm(true)}
            >
              Remove
            </Button>
          </CardAction>
        )}
      </CardHeader>

      {showRemoveConfirm && (
        <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Remove {member.username} from the project?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Their assigned issues will become unassigned.
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={memberRemove.isPending}
                onClick={() =>
                  memberRemove.mutate({
                    projectId: project.id,
                    userId: member.user_id,
                  })
                }
              >
                {memberRemove.isPending ? <Spinner /> : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

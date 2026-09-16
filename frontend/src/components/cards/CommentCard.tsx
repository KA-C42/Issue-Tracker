// components/cards/CommentCard.tsx
import { useState } from 'react'
import type { Comment, Project } from '@issue-tracker/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Username } from '../Username'
import {
  patchComment,
  deleteComment,
  issueCommentsQueryOptions,
} from '@/api/comments'
import { canPatchComment, canDeleteComment } from '@/lib/permissions'
import { useAuthProtected } from '@/auth/UseAuth'
import { ApiError } from '@/api/apiError'

export default function CommentCard({
  project,
  ...comment
}: Comment & { project: Project }) {
  const { user } = useAuthProtected()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.comment)

  const queryKey = issueCommentsQueryOptions(comment.issue_id).queryKey

  const editComment = useMutation({
    mutationFn: patchComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setIsEditing(false)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const removeComment = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Comment deleted')
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const canEdit = canPatchComment(user.id, comment)
  const canDelete = canDeleteComment(user.id, comment, project)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-medium">
          <Username userId={comment.creator_id} />{' '}
          <span className="font-normal text-muted-foreground">
            · {new Date(comment.created_at).toLocaleString()}
            {comment.modified_at !== comment.created_at
              ? ` (edited at ${new Date(comment.modified_at).toLocaleString()})`
              : ''}
          </span>
        </CardTitle>
        {!isEditing && (canEdit || canDelete) && (
          <CardAction className="flex gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="xs"
                disabled={removeComment.isPending}
                onClick={() => removeComment.mutate(comment.id)}
              >
                Delete
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={editComment.isPending || draft.trim() === ''}
                onClick={() =>
                  editComment.mutate({ commentId: comment.id, comment: draft })
                }
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(comment.comment)
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
        )}
      </CardContent>
    </Card>
  )
}

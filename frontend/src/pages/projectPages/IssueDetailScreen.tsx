import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { IssueStatus } from '@issue-tracker/shared'

import { singleProjectQueryOptions } from '@/api/projects'
import { singleIssueQueryOptions, patchIssue, deleteIssue } from '@/api/issues'
import { issueCommentsQueryOptions, postComment } from '@/api/comments'
import {
  canPatchIssue,
  canDeleteIssue,
  canPatchIssueStatus,
} from '@/lib/permissions'
import { STATUS_ITEMS } from '@/lib/issueStatusOptions'
import { useAuthProtected } from '@/auth/UseAuth'
import { useUpdateIssueStatus } from '@/hooks/useUpdateIssueStatus'
import { ApiError } from '@/api/apiError'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Username } from '@/components/Username'
import CardBox from '@/components/cards/CardBox'
import CommentCard from '@/components/cards/CommentCard'

export default function IssueDetailScreen() {
  const { id: projectId, issueId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthProtected()
  const queryClient = useQueryClient()

  const projectQuery = useQuery(singleProjectQueryOptions(projectId ?? ''))
  const issueQuery = useQuery(singleIssueQueryOptions(issueId ?? ''))
  const commentsQuery = useQuery(issueCommentsQueryOptions(issueId ?? ''))

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [detailsDraft, setDetailsDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')

  const issueQueryKey = singleIssueQueryOptions(issueId ?? '').queryKey

  const editTitle = useMutation({
    mutationFn: patchIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKey })
      setIsEditingTitle(false)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const editDetails = useMutation({
    mutationFn: patchIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueQueryKey })
      setIsEditingDetails(false)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const removeIssue = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      toast.success('Issue deleted')
      navigate(`/projects/${projectId}`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  const updateStatus = useUpdateIssueStatus(projectId ?? '')

  const addComment = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      setCommentDraft('')
      queryClient.invalidateQueries({
        queryKey: issueCommentsQueryOptions(issueId ?? '').queryKey,
      })
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  if (!projectId || !issueId) return <div>Issue not found</div>

  if (issueQuery.isLoading || projectQuery.isLoading) {
    return (
      <div className="flex flex-1 gap-6 p-4">
        <Skeleton className="h-full flex-1" />
        <Skeleton className="h-full w-96" />
      </div>
    )
  }

  if (issueQuery.isError || !issueQuery.data) {
    return (
      <div className="p-4">
        This issue doesn't exist, or you don't have access to it.
      </div>
    )
  }
  if (projectQuery.isError || !projectQuery.data) {
    return <div className="p-4">Couldn't load this project.</div>
  }

  const issue = issueQuery.data
  const project = projectQuery.data

  const canEdit = canPatchIssue(user.id, issue, project)
  const canDelete = canDeleteIssue(user.id, issue, project)
  const canChangeStatus = canPatchIssueStatus(user.id, issue, project)

  return (
    <div className="flex flex-1 flex-col gap-4 px-10 py-4 sm:min-h-0 sm:overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 sm:min-h-0 sm:flex-row">
        {/* left column: issue details */}
        <div className="flex w-full flex-col gap-4 sm:w-1/2 sm:overflow-y-auto">
          {isEditingTitle ? (
            <div className="flex flex-col gap-2">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={editTitle.isPending || titleDraft.trim() === ''}
                  onClick={() =>
                    editTitle.mutate({ issueId, data: { title: titleDraft } })
                  }
                >
                  {editTitle.isPending ? <Spinner /> : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold">{issue.title}</h1>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setTitleDraft(issue.title)
                    setIsEditingTitle(true)
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          )}

          <div className="border-t" />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Code
              </span>
              <span className="text-sm">
                {project.code}-{issue.code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <Select
                items={STATUS_ITEMS}
                value={issue.status}
                disabled={!canChangeStatus || updateStatus.isPending}
                onValueChange={(value) =>
                  updateStatus.mutate({
                    issueId,
                    newStatus: value as IssueStatus,
                  })
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Assignee
              </span>
              {/* TODO: real options once project members are queryable */}
              <Select disabled>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
          </div>

          <div className="border-t" />

          {isEditingDetails ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={detailsDraft}
                onChange={(e) => setDetailsDraft(e.target.value)}
                rows={10}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={editDetails.isPending}
                  onClick={() =>
                    editDetails.mutate({
                      issueId,
                      data: { details: detailsDraft || null },
                    })
                  }
                >
                  {editDetails.isPending ? <Spinner /> : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDetails(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm whitespace-pre-wrap">
                {issue.details || 'No description'}
              </p>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setDetailsDraft(issue.details ?? '')
                    setIsEditingDetails(true)
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-1 text-xs text-muted-foreground">
            <div>
              Created by <Username userId={issue.creator_id} /> on{' '}
              {new Date(issue.created_at).toLocaleString()}
            </div>
            <div>
              Last modified {new Date(issue.modified_at).toLocaleString()}
            </div>
            <div>
              Status last changed{' '}
              {new Date(issue.status_changed_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* right column: comments */}
        <div className="flex w-full flex-col gap-3 sm:w-1/2 sm:min-h-0">
          <div className="flex-1 sm:min-h-0">
            {commentsQuery.isLoading && <Skeleton className="h-full w-full" />}
            {commentsQuery.isError && (
              <p className="text-sm text-muted-foreground">
                Couldn't load comments.
              </p>
            )}
            {commentsQuery.data && (
              <CardBox
                title="Comments"
                data={commentsQuery.data}
                CardType={CommentCard}
                extraProps={{ project }}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Add a comment"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
            />
            <Button
              className="self-end"
              disabled={addComment.isPending || commentDraft.trim() === ''}
              onClick={() =>
                addComment.mutate({ issueId, comment: commentDraft })
              }
            >
              {addComment.isPending ? <Spinner /> : 'Comment'}
            </Button>
          </div>
        </div>
      </div>

      {canDelete && (
        <div className="flex justify-start border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      )}

      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this issue?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This can't be undone.
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={removeIssue.isPending}
                onClick={() => removeIssue.mutate(issueId)}
              >
                {removeIssue.isPending ? <Spinner /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

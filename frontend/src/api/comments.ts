import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'
import type { Comment } from '@issue-tracker/shared'

export const issueCommentsQueryOptions = (issueId: string) =>
  queryOptions({
    queryKey: ['comments', issueId],
    queryFn: ({ signal }) => getComments(signal, issueId),
  })

async function getComments(
  abortSignal: AbortSignal,
  issueId: string,
): Promise<Comment[]> {
  return apiFetch('GET', `/api/issues/${issueId}/comments`, {
    signal: abortSignal,
  })
}

async function postComment({
  issueId,
  comment,
}: {
  issueId: string
  comment: string
}) {
  return apiFetch('POST', `/api/issues/${issueId}/comments`, {
    body: { comment },
  })
}

async function patchComment({
  commentId,
  comment,
}: {
  commentId: string
  comment: string
}) {
  return apiFetch('PATCH', `/api/comments/${commentId}`, { body: { comment } })
}

async function deleteComment(commentId: string) {
  await apiFetch('DELETE', `/api/comments/${commentId}`)
}

export { getComments, postComment, patchComment, deleteComment }

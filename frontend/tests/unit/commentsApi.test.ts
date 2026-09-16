import { vi, test, expect } from 'vitest'
import { postComment, patchComment, deleteComment } from '@/api/comments'
import * as apiFetchModule from '@/api/apiFetch'

test('postComment posts to the issue comments endpoint', async () => {
  const spy = vi.spyOn(apiFetchModule, 'apiFetch').mockResolvedValue({})
  await postComment({ issueId: 'issue-1', comment: 'looks good' })
  expect(spy).toHaveBeenCalledWith(
    'POST',
    '/api/issues/issue-1/comments',
    expect.objectContaining({
      body: expect.objectContaining({ comment: 'looks good' }),
    }),
  )
})

test('patchComment patches the comment endpoint', async () => {
  const spy = vi.spyOn(apiFetchModule, 'apiFetch').mockResolvedValue({})
  await patchComment({ commentId: 'comment-1', comment: 'edited' })
  expect(spy).toHaveBeenCalledWith(
    'PATCH',
    '/api/comments/comment-1',
    expect.objectContaining({
      body: expect.objectContaining({ comment: 'edited' }),
    }),
  )
})

test('deleteComment deletes the comment endpoint', async () => {
  const spy = vi.spyOn(apiFetchModule, 'apiFetch').mockResolvedValue({})
  await deleteComment('comment-1')
  expect(spy).toHaveBeenCalledWith('DELETE', '/api/comments/comment-1')
})

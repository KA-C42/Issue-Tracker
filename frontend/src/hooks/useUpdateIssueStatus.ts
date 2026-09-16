// hooks/useUpdateIssueStatus.ts
import { ApiError } from '@/api/apiError'
import {
  projectIssuesQueryOptions,
  singleIssueQueryOptions,
  updateIssueStatus,
} from '@/api/issues'
import type { Issue } from '@issue-tracker/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useUpdateIssueStatus(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateIssueStatus,
    onMutate: async ({ issueId, newStatus }) => {
      const listKey = projectIssuesQueryOptions(projectId).queryKey
      const issueKey = singleIssueQueryOptions(issueId).queryKey

      await queryClient.cancelQueries({ queryKey: listKey })
      await queryClient.cancelQueries({ queryKey: issueKey })

      const previousIssues = queryClient.getQueryData<Issue[]>(listKey)
      const previousIssue = queryClient.getQueryData<Issue>(issueKey)

      queryClient.setQueryData<Issue[]>(
        listKey,
        (old) =>
          old?.map((issue) =>
            issue.id === issueId ? { ...issue, status: newStatus } : issue,
          ) ?? [],
      )
      queryClient.setQueryData<Issue>(issueKey, (old) =>
        old ? { ...old, status: newStatus } : old,
      )

      return { previousIssues, previousIssue }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectIssuesQueryOptions(projectId).queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: singleIssueQueryOptions(data.id).queryKey,
      })
      toast.success(`Issue '${data.title}' status successfully updated`)
    },
    onError: (err, variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(
          projectIssuesQueryOptions(projectId).queryKey,
          context.previousIssues,
        )
      }
      if (context?.previousIssue) {
        queryClient.setQueryData(
          singleIssueQueryOptions(variables.issueId).queryKey,
          context.previousIssue,
        )
      }
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      )
    },
  })
}

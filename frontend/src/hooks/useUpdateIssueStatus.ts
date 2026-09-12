import { ApiError } from '@/api/apiError'
import { projectIssuesQueryOptions, updateIssueStatus } from '@/api/issues'
import type { Issue } from '@issue-tracker/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useUpdateIssueStatus(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateIssueStatus,
    onMutate: async ({ issueId, newStatus }) => {
      const queryKey = projectIssuesQueryOptions(projectId).queryKey

      // stop any in-flight refetch from clobbering our optimistic write
      await queryClient.cancelQueries({ queryKey })

      // snapshot so we can restore it if the request fails
      const previousIssues = queryClient.getQueryData<Issue[]>(queryKey)

      queryClient.setQueryData<Issue[]>(
        queryKey,
        (old) =>
          old?.map((issue) =>
            issue.id === issueId ? { ...issue, status: newStatus } : issue,
          ) ?? [],
      )

      return { previousIssues }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectIssuesQueryOptions(projectId).queryKey,
      })
      toast.success(`Issue '${data.title}' status successfully updated`)
    },
    onError: (err, _variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(
          projectIssuesQueryOptions(projectId).queryKey,
          context.previousIssues,
        )
      }
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Something went wrong')
      }
    },
  })
}

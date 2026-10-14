// hooks/useExitProject.ts
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { projectsQueryOptions, singleProjectQueryOptions } from '@/api/projects'
import { projectIssuesQueryOptions } from '@/api/issues'
import { projectContributorsQueryOptions } from '@/api/contributors'
import { projectInvitesQueryOptions } from '@/api/invites'

// For when the current user can no longer see a project, because they deleted
// it or left it. Returns a function to call from the mutation's onSuccess.
// The order of the steps matters, which is why they live together here.
export function useExitProject(projectId: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return () => {
    navigate('/', { replace: true })

    queryClient.setQueryData(projectsQueryOptions.queryKey, (projects) =>
      projects?.filter((p) => p.id !== projectId),
    )
    queryClient.invalidateQueries({ queryKey: projectsQueryOptions.queryKey })

    queryClient.removeQueries({
      queryKey: singleProjectQueryOptions(projectId).queryKey,
    })
    queryClient.removeQueries({
      queryKey: projectIssuesQueryOptions(projectId).queryKey,
    })
    queryClient.removeQueries({
      queryKey: projectContributorsQueryOptions(projectId).queryKey,
    })
    queryClient.removeQueries({
      queryKey: projectInvitesQueryOptions(projectId).queryKey,
    })
  }
}

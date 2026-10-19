// hooks/useExitProject.ts
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  contributingProjectsQueryOptions,
  myProjectsKey,
  ownedProjectsQueryOptions,
  singleProjectQueryOptions,
} from '@/api/projects'
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

    // deleting removes it from owned, leaving removes it from contributing
    queryClient.setQueryData(ownedProjectsQueryOptions.queryKey, (projects) =>
      projects?.filter((p) => p.id !== projectId),
    )
    queryClient.setQueryData(
      contributingProjectsQueryOptions.queryKey,
      (projects) => projects?.filter((p) => p.id !== projectId),
    )
    queryClient.invalidateQueries({ queryKey: myProjectsKey })

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

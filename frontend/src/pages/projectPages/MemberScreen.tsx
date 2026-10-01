import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectContributorsQueryOptions } from '@/api/contributors'
import { Skeleton } from '@/components/ui/skeleton'
import CardBox from '@/components/cards/CardBox'
import MemberCard from '@/components/cards/MemberCard'
import { InvitesBox } from '@/components/InvitesBox'
import { singleProjectQueryOptions } from '@/api/projects'

export default function MemberScreen() {
  const { id: projectId } = useParams()
  const membersQuery = useQuery(
    projectContributorsQueryOptions(projectId ?? ''),
  )
  const { data: project } = useQuery(singleProjectQueryOptions(projectId ?? ''))

  if (!projectId) return <div>Project not found</div>

  return (
    <div className="flex flex-1 flex-col gap-4 px-10 py-4 sm:min-h-0 sm:overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 sm:min-h-0 sm:flex-row">
        {/* left column: members */}
        <div className="flex w-full flex-col sm:w-1/2 sm:min-h-0">
          {membersQuery.isLoading && <Skeleton className="h-full w-full" />}
          {membersQuery.isError && (
            <p className="text-sm text-muted-foreground">
              Couldn't load members.
            </p>
          )}
          {membersQuery.data && project && (
            <CardBox
              title="Members"
              data={membersQuery.data}
              renderCard={(member) => (
                <MemberCard
                  key={member.user_id}
                  {...member}
                  project={project}
                />
              )}
            />
          )}
        </div>
        {/* right column: invites */}
        <div className="flex w-full flex-col sm:w-1/2 sm:min-h-0">
          <InvitesBox projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

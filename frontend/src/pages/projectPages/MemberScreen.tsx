import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectContributorsQueryOptions } from '@/api/contributors'
import { Skeleton } from '@/components/ui/skeleton'
import { InviteForm } from '@/components/InviteForm'
import CardBox from '@/components/cards/CardBox'
import MemberCard from '@/components/cards/MemberCard'

export default function MemberScreen() {
  const { id: projectId } = useParams()
  const membersQuery = useQuery(
    projectContributorsQueryOptions(projectId ?? ''),
  )

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
          {membersQuery.data && (
            <CardBox
              title="Members"
              data={membersQuery.data}
              renderCard={(member) => (
                <MemberCard key={member.user_id} {...member} />
              )}
            />
          )}
        </div>
        {/* right column: invites */}
        <div className="flex w-full flex-col gap-4 sm:w-1/2 sm:overflow-y-auto">
          <h2 className="text-xl font-semibold">Invites</h2>

          <div className="border-t" />

          <InviteForm projectId={projectId} />
        </div>
      </div>
    </div>
  )
}

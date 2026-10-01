import { useQuery } from '@tanstack/react-query'
import { projectInvitesQueryOptions } from '@/api/invites'
import CardBox from './cards/CardBox'
import InviteCard from './cards/InviteCard'
import { InviteForm } from './InviteForm'
import { Skeleton } from './ui/skeleton'

interface InvitesPanelProps {
  projectId: string
}

export function InvitesBox({ projectId }: InvitesPanelProps) {
  const invitesQuery = useQuery(projectInvitesQueryOptions(projectId))

  return (
    <div className="flex flex-1 flex-col gap-3 sm:min-h-0">
      <InviteForm projectId={projectId} />

      <div className="flex-1 sm:min-h-0">
        {invitesQuery.isLoading && <Skeleton className="h-full w-full" />}
        {invitesQuery.isError && (
          <p className="text-sm text-muted-foreground">
            Couldn't load invites.
          </p>
        )}
        {invitesQuery.data && (
          <CardBox
            title="Pending Invites"
            data={invitesQuery.data}
            renderCard={(invite) => <InviteCard key={invite.id} {...invite} />}
          />
        )}
      </div>
    </div>
  )
}

import { receivedInvitesQueryOptions } from '@/api/invites'
import {
  contributingProjectsQueryOptions,
  ownedProjectsQueryOptions,
} from '@/api/projects'
import CardBox from '@/components/cards/CardBox'
import ContributingProjectCard from '@/components/cards/ContributingProjectCard'
import OwnedProjectCard from '@/components/cards/OwnedProjectCard'
import ReceivedInviteCard from '@/components/cards/ReceivedInviteCard'
import { CreateProjectForm } from '@/components/CreateProjectForm'
import { FormDialog } from '@/components/FormDialog'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Dashboard() {
  const [, setPageName] =
    useOutletContext<[string, Dispatch<SetStateAction<string>>]>()

  useEffect(() => {
    setPageName('Dashboard')
  }, [setPageName])

  const [showCreateForm, setShowCreateForm] = useState(false)

  const ownedQuery = useQuery(ownedProjectsQueryOptions)
  const contributingQuery = useQuery(contributingProjectsQueryOptions)

  // get pending invites
  const invitesQuery = useQuery(receivedInvitesQueryOptions)
  const invites = invitesQuery?.data

  return (
    <div className="flex justify-center sm:h-full sm:overflow-y-auto p-4">
      <div className="flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-xl font-semibold text-center">Projects</h1>

          <button
            onClick={() => setShowCreateForm(true)}
            className="border p-2"
          >
            New Project
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 sm:flex-1 sm:min-h-0 sm:auto-rows-fr">
          <CardBox
            title="Owned Projects"
            isError={ownedQuery.isError}
            data={ownedQuery.data}
            renderCard={(project) => (
              <OwnedProjectCard key={project.id} {...project} />
            )}
          />
          <CardBox
            title="Contributing Projects"
            isError={contributingQuery.isError}
            data={contributingQuery.data}
            renderCard={(project) => (
              <ContributingProjectCard key={project.id} {...project} />
            )}
          />
          <CardBox
            title="Pending Invites"
            isError={invitesQuery.isError}
            data={invites}
            renderCard={(invite) => (
              <ReceivedInviteCard key={invite.id} {...invite} />
            )}
          />
        </div>
      </div>

      {showCreateForm && (
        <FormDialog
          open={showCreateForm}
          setOpen={setShowCreateForm}
          title={'Create Project'}
          description={''}
        >
          <CreateProjectForm close={() => setShowCreateForm(false)} />
        </FormDialog>
      )}
    </div>
  )
}

import { receivedInvitesQueryOptions } from '@/api/invites'
import { profileQueryOptions } from '@/api/profiles'
import { projectsQueryOptions } from '@/api/projects'
import { useAuthProtected } from '@/auth/UseAuth'
import CardBox from '@/components/cards/CardBox'
import OwnedProjectCard from '@/components/cards/OwnedProjectCard'
import ReceivedInviteCard from '@/components/cards/ReceivedInviteCard'
import { CreateProjectForm } from '@/components/CreateProjectForm'
import { FormDialog } from '@/components/FormDialog'
import type { Project } from '@issue-tracker/shared'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useOutletContext } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuthProtected()

  const [, setPageName] =
    useOutletContext<[string, Dispatch<SetStateAction<string>>]>()
  const profileQuery = useQuery(profileQueryOptions)

  useEffect(() => {
    if (profileQuery.isLoading) setPageName('Loading...')
    if (profileQuery.isSuccess)
      setPageName(profileQuery.data?.username ?? 'Loading...')
    if (profileQuery.isError) setPageName('profile unavailable')
  }, [setPageName, profileQuery])

  const [showCreateForm, setShowCreateForm] = useState(false)

  const projectQuery = useQuery(projectsQueryOptions)
  const projects = projectQuery?.data
  const ownedProjects = projects?.filter(
    (project: Project) => project.creator_id === user.id,
  )
  const contributingProjects = projects?.filter(
    (project: Project) => project.creator_id !== user.id,
  )

  // get pending invites
  const inviteQuery = useQuery(receivedInvitesQueryOptions)
  const invites = inviteQuery?.data

  return (
    <div className="flex justify-center">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardBox
            title="Owned Projects"
            data={ownedProjects ?? []}
            renderCard={(project) => (
              <OwnedProjectCard key={project.id} {...project} />
            )}
          />
          {/* 
          adding this cardbox to to prevent dead code with the filter.
          ContributingProjectCard will be added in a future update
          for now, type Project still maps neatly regardless of owner
          */}
          <CardBox
            title="Contributing Projects"
            data={contributingProjects ?? []}
            renderCard={(project) => (
              <OwnedProjectCard key={project.id} {...project} />
            )}
          />
          <CardBox
            title="Pending Invites"
            data={invites ?? []}
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

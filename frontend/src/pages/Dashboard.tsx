import { projectsQueryOptions } from '@/api/projects'
import { useAuthProtected } from '@/auth/UseAuth'
import CardBox from '@/components/cards/CardBox'
import OwnedProjectCard from '@/components/cards/OwnedProjectCard'
import { CreateProjectForm } from '@/components/CreateProjectForm'
import { FormDialog } from '@/components/FormDialog'
import type { Project } from '@/types/db'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

// TODO as separate commit: load username in navbar from dashboard -> useAuth?
export default function Dashboard() {
  const { user } = useAuthProtected()

  const [showCreateForm, setShowCreateForm] = useState(false)

  // get and sort projects
  /* 
  api returns all owned/contributing when search by token/user id
  project contributors are impossible for now, but i still want the filter for consistency
  */
  const projectQuery = useQuery(projectsQueryOptions)
  const projects = projectQuery?.data
  const ownedProjects = projects?.filter(
    (project: Project) => project.owner_id === user.id,
  )
  const contributingProjects = projects?.filter(
    (project: Project) => project.owner_id !== user.id,
  )

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-xl font-semibold text-center">Projects</h1>

          <button
            onClick={() => setShowCreateForm(true)}
            className="border p-2"
          >
            New Project
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CardBox
            title="Owned Projects"
            data={ownedProjects ?? []}
            CardType={OwnedProjectCard}
          />
          {/* 
          adding this cardbox to to prevent dead code with the filter.
          ContributingProjectCard will be added in a future update
          for now, type Project still maps neatly regardless of owner
          */}
          <CardBox
            title="Contributor Projects"
            data={contributingProjects ?? []}
            CardType={OwnedProjectCard}
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

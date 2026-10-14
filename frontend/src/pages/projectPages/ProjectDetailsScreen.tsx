import { singleProjectQueryOptions } from '@/api/projects'
import { useAuthProtected } from '@/auth/UseAuth'
import { DeleteProjectSection } from '@/components/DeleteProjectSection'
import { FormDialog } from '@/components/FormDialog'
import { LeaveProjectSection } from '@/components/LeaveProjectSection'
import { PatchProjectForm } from '@/components/PatchProjectForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Username } from '@/components/Username'
import {
  canDeleteProject,
  canLeaveProject,
  canPatchProject,
} from '@/lib/permissions'
import type { Project } from '@issue-tracker/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

export default function ProjectDetailsScreen() {
  const { id: projectId } = useParams()
  if (!projectId) return <Navigate to={'/'} replace />

  return <ProjectDetails projectId={projectId} />
}

function ProjectDetails({ projectId }: { projectId: string }) {
  const {
    isLoading,
    isError,
    data: project,
  } = useQuery(singleProjectQueryOptions(projectId))

  return (
    <div className="mx-auto w-full max-w-2xl py-4">
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && !project && (
        <p className="text-sm text-muted-foreground">Couldn't load project.</p>
      )}
      {project && <ProjectInfo project={project} />}
    </div>
  )
}

function ProjectInfo({ project }: { project: Project }) {
  const { user } = useAuthProtected()
  const [showEditForm, setShowEditForm] = useState(false)

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          {canPatchProject(user.id, project) && (
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
              >
                Edit
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6 text-sm">
          <p className="whitespace-pre-wrap">
            {project.description || (
              <span className="text-muted-foreground">No description</span>
            )}
          </p>
          <dl className="grid grid-cols-[7rem_1fr] gap-y-2 border-t pt-4">
            <dt className="text-muted-foreground">Issue code</dt>
            <dd className="font-mono">{project.code}</dd>
            <dt className="text-muted-foreground">Owner</dt>
            <dd>
              <Username userId={project.creator_id} />
            </dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(project.created_at).toLocaleDateString()}</dd>
          </dl>{' '}
        </CardContent>
      </Card>

      {canDeleteProject(user.id, project) && (
        <DeleteProjectSection project={project} />
      )}

      {canLeaveProject(user.id, project) && (
        <LeaveProjectSection project={project} />
      )}

      {showEditForm && (
        <FormDialog
          open={showEditForm}
          setOpen={setShowEditForm}
          title="Edit Project"
          description={null}
        >
          <PatchProjectForm
            project={project}
            close={() => setShowEditForm(false)}
          />
        </FormDialog>
      )}
    </>
  )
}

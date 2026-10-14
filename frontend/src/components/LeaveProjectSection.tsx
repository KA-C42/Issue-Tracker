import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Project } from '@issue-tracker/shared'
import { leaveProject } from '@/api/contributors'
import { ApiError } from '@/api/apiError'
import { useExitProject } from '@/hooks/useExitProject'
import { DangerZone } from './DangerZone'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function LeaveProjectSection({ project }: { project: Project }) {
  const exitProject = useExitProject(project.id)
  const [showConfirm, setShowConfirm] = useState(false)

  const projectLeave = useMutation({
    mutationFn: leaveProject,
    onSuccess: () => {
      exitProject()
      toast.success(`You left '${project.title}'`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  return (
    <>
      <DangerZone
        title="Leave this project"
        description="You'll lose access, and issues assigned to you will be unassigned."
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirm(true)}
        >
          Leave
        </Button>
      </DangerZone>

      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave '{project.title}'?</DialogTitle>
              <DialogDescription>
                You'll lose access to this project and its issues, and any
                issues assigned to you will be unassigned. To rejoin, you'll
                need a new invite.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={projectLeave.isPending}
                onClick={() => projectLeave.mutate(project.id)}
              >
                {projectLeave.isPending ? <Spinner /> : 'Leave project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

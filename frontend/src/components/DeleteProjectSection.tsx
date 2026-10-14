import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Project } from '@issue-tracker/shared'
import { deleteProject } from '@/api/projects'
import { ApiError } from '@/api/apiError'
import { useExitProject } from '@/hooks/useExitProject'
import { DangerZone } from './DangerZone'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function DeleteProjectSection({ project }: { project: Project }) {
  const exitProject = useExitProject(project.id)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // This component stays mounted when the dialog closes, so its state would
  // survive too. Clear the typed text whenever the dialog closes.
  const handleOpenChange = (open: boolean) => {
    setShowConfirm(open)
    if (!open) setConfirmText('')
  }

  const projectDelete = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      exitProject()
      toast.success(`Project '${project.title}' deleted`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  return (
    <>
      <DangerZone
        title="Delete this project"
        description="Permanently removes it along with all of its issues and comments."
      >
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirm(true)}
        >
          Delete
        </Button>
      </DangerZone>

      {showConfirm && (
        <Dialog open={showConfirm} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete '{project.title}'?</DialogTitle>
              <DialogDescription>
                This permanently deletes the project, all of its issues and
                comments, and any pending invites. Members will lose access.
                This can't be undone.
              </DialogDescription>
            </DialogHeader>
            <label className="flex flex-col gap-2 text-sm">
              <span>
                Type <strong>{project.title}</strong> to confirm.
              </span>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
            </label>
            <DialogFooter>
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={
                  confirmText !== project.title || projectDelete.isPending
                }
                onClick={() => projectDelete.mutate(project.id)}
              >
                {projectDelete.isPending ? <Spinner /> : 'Delete project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

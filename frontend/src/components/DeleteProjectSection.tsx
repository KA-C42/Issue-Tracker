import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Project } from '@issue-tracker/shared'
import {
  deleteProject,
  projectsQueryOptions,
  singleProjectQueryOptions,
} from '@/api/projects'
import { projectIssuesQueryOptions } from '@/api/issues'
import { projectContributorsQueryOptions } from '@/api/contributors'
import { ApiError } from '@/api/apiError'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
      navigate('/', { replace: true })

      queryClient.invalidateQueries({ queryKey: projectsQueryOptions.queryKey })

      // REMOVE, not invalidate. These things no longer exist
      queryClient.removeQueries({
        queryKey: singleProjectQueryOptions(project.id).queryKey,
      })
      queryClient.removeQueries({
        queryKey: projectIssuesQueryOptions(project.id).queryKey,
      })
      queryClient.removeQueries({
        queryKey: projectContributorsQueryOptions(project.id).queryKey,
      })

      toast.success(`Project '${project.title}' deleted`)
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : 'Something went wrong',
      ),
  })

  return (
    <section className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-destructive/50 p-4">
      <div>
        <h2 className="text-sm font-medium">Delete this project</h2>
        <p className="text-xs text-muted-foreground">
          Permanently removes it along with all of its issues and comments.
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
      >
        Delete
      </Button>

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
    </section>
  )
}

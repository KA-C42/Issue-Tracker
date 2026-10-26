import { useSortable } from '@dnd-kit/react/sortable'
import { useQuery } from '@tanstack/react-query'
import type { Issue } from '@issue-tracker/shared'
import { singleProjectQueryOptions } from '@/api/projects'
import { useAuthProtected } from '@/auth/UseAuth'
import { canPatchIssueStatus } from '@/lib/permissions'
import IssueCard from './IssueCard'

export function DraggableIssueCard({
  issue,
  index,
}: {
  issue: Issue
  index: number
}) {
  const { user } = useAuthProtected()
  const { data: project } = useQuery(
    singleProjectQueryOptions(issue.project_id),
  )
  const canDrag = !!project && canPatchIssueStatus(user.id, issue, project)

  const { ref, handleRef } = useSortable({
    id: issue.id,
    index,
    group: issue.status,
    // without a handle, dnd-kit drags by the whole card, so hiding it isn't enough
    disabled: !canDrag,
  })

  return (
    <div
      ref={ref}
      style={{ touchAction: 'none', userSelect: 'none' }}
      className="relative"
    >
      {canDrag && (
        <button
          type="button"
          ref={handleRef}
          aria-label={`Drag ${issue.title}`}
          className="absolute right-2 top-2 z-10 cursor-grab text-muted-foreground"
        >
          ⠿
        </button>
      )}
      <IssueCard {...issue} />
    </div>
  )
}

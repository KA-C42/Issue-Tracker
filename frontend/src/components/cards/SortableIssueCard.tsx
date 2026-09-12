import { useSortable } from '@dnd-kit/react/sortable'
import IssueCard from './IssueCard'
import type { Issue } from '@issue-tracker/shared'

export function SortableIssueCard({
  issue,
  index,
}: {
  issue: Issue
  index: number
}) {
  const { ref, handleRef } = useSortable({
    id: issue.id,
    index,
    group: issue.status,
  })

  return (
    <div
      ref={ref}
      style={{ touchAction: 'none', userSelect: 'none' }}
      className="relative"
    >
      <div
        ref={handleRef}
        className="absolute right-2 top-2 z-10 cursor-grab text-muted-foreground"
      >
        ⠿
      </div>
      <IssueCard {...issue} />
    </div>
  )
}

import type { Issue, IssueStatus } from '@issue-tracker/shared'
import { DraggableIssueCard } from './DraggableIssueCard'
import CardBox from './CardBox'
import { useDroppable } from '@dnd-kit/react'

export function DroppableCardbox({
  status,
  title,
  issueData,
}: {
  status: IssueStatus
  title: string
  issueData: Issue[] | undefined
}) {
  const { ref } = useDroppable({ id: status })

  return (
    <div ref={ref} className="min-h-0">
      <CardBox
        title={title}
        data={issueData}
        renderCard={(issue, index) => (
          <DraggableIssueCard key={issue.id} issue={issue} index={index} />
        )}
      />
    </div>
  )
}

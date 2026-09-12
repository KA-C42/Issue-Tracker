import type { Issue, IssueStatus } from '@issue-tracker/shared'
import { SortableIssueCard } from './SortableIssueCard'
import CardBox from './CardBox'
import { useDroppable } from '@dnd-kit/react'

export function DroppableCardbox({
  status,
  title,
  issueData,
}: {
  status: IssueStatus
  title: string
  issueData: Issue[]
}) {
  const { ref } = useDroppable({ id: status })

  return (
    <div ref={ref}>
      <CardBox
        title={title}
        data={issueData}
        CardType={(issue: Issue) => (
          <SortableIssueCard issue={issue} index={issueData.indexOf(issue)} />
        )}
      />
    </div>
  )
}

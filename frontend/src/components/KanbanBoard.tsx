import { DragDropProvider } from '@dnd-kit/react'
import type { Issue, IssueStatus } from '@issue-tracker/shared'
import { projectIssuesQueryOptions } from '@/api/issues'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getStatusUpdateFromDragEnd } from '@/lib/kanbanUtils'
import { useUpdateIssueStatus } from '@/hooks/useUpdateIssueStatus'
import { DroppableCardbox } from './cards/DroppableCardBox'

const COLUMNS: { status: IssueStatus; title: string }[] = [
  { status: 'BACKLOG', title: 'Backlog' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'DONE', title: 'Done' },
]

export function KanbanBoard() {
  const { id } = useParams()

  const { data: issues, isError } = useQuery(
    projectIssuesQueryOptions(id as string),
  )
  const issueStatusPatch = useUpdateIssueStatus(id ?? '')

  if (!issues && isError)
    return <p className="text-center">Couldn't load issues. Try refreshing.</p>

  return (
    <DragDropProvider
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDragEnd={async (event) => {
        const result = getStatusUpdateFromDragEnd(event)
        if (!result) return

        issueStatusPatch.mutate(result)
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 min-h-0">
        {COLUMNS.map(({ status, title }) => (
          <DroppableCardbox
            status={status}
            title={title}
            issueData={
              issues
                ? issues.filter((i: Issue) => i.status === status)
                : undefined
            }
          />
        ))}
      </div>
    </DragDropProvider>
  )
}

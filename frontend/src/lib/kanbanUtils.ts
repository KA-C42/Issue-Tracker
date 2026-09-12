import { isSortable } from '@dnd-kit/react/sortable'
import type { DragEndEvent } from '@dnd-kit/react'
import type { IssueStatus } from '@issue-tracker/shared'

export function getStatusUpdateFromDragEnd(event: DragEndEvent) {
  const { source, target, canceled } = event.operation
  if (canceled || !source || !target || !isSortable(source)) return null
  const fromStatus = source.initialGroup
  const toStatus = isSortable(target) ? target.group : target.id
  if (fromStatus === toStatus) return null
  return { issueId: source.id as string, newStatus: toStatus as IssueStatus }
}

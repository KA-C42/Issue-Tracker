import { getStatusUpdateFromDragEnd } from '@/lib/kanbanUtils'
import type { DragEndEvent } from '@dnd-kit/react'
import { expect, test, vi } from 'vitest'

test('returns null when dropped in same column', () => {
  const event = {
    operation: {
      source: { id: 'abc', initialGroup: 'BACKLOG' },
      target: { group: 'BACKLOG' },
      canceled: false,
    },
  } as unknown as DragEndEvent
  expect(getStatusUpdateFromDragEnd(event)).toBeNull()
})

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortable: () => true,
}))

test('returns issue id and new status when dropped in different column', () => {
  const event = {
    operation: {
      source: { id: 'abc', initialGroup: 'BACKLOG' },
      target: { group: 'DONE' },
      canceled: false,
    },
  } as unknown as DragEndEvent
  expect(getStatusUpdateFromDragEnd(event)).toEqual({
    issueId: 'abc',
    newStatus: 'DONE',
  })
})

import type { IssueStatus } from '@issue-tracker/shared'

export const STATUS_ITEMS = [
  { key: 'BACKLOG', value: 'BACKLOG', label: 'Backlog' },
  { key: 'IN_PROGRESS', value: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', value: 'DONE', label: 'Done' },
] as const satisfies { key: IssueStatus; value: IssueStatus; label: string }[]

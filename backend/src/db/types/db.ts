import type { IssueStatus } from './enums.js'

type User = {
  id: string
  username: string
  created_at: string
}

type Project = {
  id: string
  name: string
  description: string
  owner_id: string
  modified_at: string
  created_at: string
}

type ProjectContributor = {
  user_id: string
  project_id: string
  joined_at: string
}

type Issue = {
  id: string
  creator_id: string
  project_id: string
  title: string
  code: number
  details?: string
  status: IssueStatus
  assignee_id?: string
  status_changed_at: string
  modified_at: string
  created_at: string
}

type Comment = {
  id: string
  author_id: string
  issue_id: string
  comment: string
  modified_at: string
  created_at: string
}

export type { User, Project, ProjectContributor, Issue, Comment }

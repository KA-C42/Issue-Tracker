import type { InviteStatus, IssueStatus } from './enums.ts'

// TODO: move to shared types folder with backend

type User = {
  id: string
  email: string
}

type Profile = {
  id: string
  username: string
  email: string
  created_at: string
}

type Project = {
  id: string
  name: string
  description: string
  code: string
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

type Invitation = {
  id: string
  sender_id: string
  receiver_id: string
  project_id: string
  status: InviteStatus
  sent_at: string
  status_changed_at: string
}

export type {
  User,
  Profile,
  Project,
  ProjectContributor,
  Issue,
  Comment,
  Invitation,
}

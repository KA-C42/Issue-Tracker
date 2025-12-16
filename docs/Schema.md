# Database Schema - Issue Tracker (MVP)


## Entity Relationships

 - users -> projects (owner): one-to-many
 - users <-> projects (contributor): many-to-many via project_contributors
 - users -> issues (creator): one-to-many
 - users -> issues (assignee): one-to-many (optional)
 - users -> comments: one-to-many
 - users -> notifications (actor): one-to-many
 - users -> sent_notifications (recipient): one-to-many
 - users -> invitations (sender): one-to-many
 - users -> invitations (recipient): one-to-many
 - projects -> issues: one-to-many
 - issues -> comments: one-to-many
 - notifications -> sent_notifications: one-to-many

 ### Non-foreign key relationships

 - notifications -> ( projects | issues | comments | invites ): many-to-one (optional polymorphic relationship, via notifications.entity_type and notifications.entity_id)



## Schema Tables

PK = Primary Key, CPK = Composite Primary Key, FK = Foreign Key, UK = Unique Constraint, NN = Not Null

### users

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| user_id      | UUID        | PK                                           | Supabase Auth user ID |
| username     | TEXT        | UK, NN                                       |       |
| created_at   | TIMESTAMP   | NN, DEFAULT now()                            |       |
| deactivated_at | TIMESTAMP | DEFAULT NULL                                 | soft delete users (if user owns no projects) |

### project_contributors

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| user_id      | UUID        | CPK, FK -> users.user_id                     |       |
| project_id   | UUID        | CPK, FK -> projects.project_id               |       |
| joined_at    | TIMESTAMP   | NN, DEFAULT now()                            |       |

Additional Constraints and Indexes:
 - INDEX (project_id, joined_at)
    - supports member list display ordered by join date

### projects

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| project_id   | UUID        | PK                                           |       |
| owner_id     | UUID        | NN, FK -> users.user_id                      | creator, ownership transferable post-MVP |
| project_name | TEXT        | NN                                           |       |
| description  | TEXT        |                                              |       |
| modified_at  | TIMESTAMP   |                                              | set on update |
| created_at   | TIMESTAMP   | NN, DEFAULT now()                            |       |

Additional Constraints and Indexes:
 - UK (owner_id, project_name)
    - enforces unique name per owner
    - can support "owned projects" display on user dashboard

### issues

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| issue_id     | UUID        | PK                                           |       |
| creator_id   | UUID        | NN, FK -> users.user_id                      | creator |
| project_id   | UUID        | NN, FK -> projects.project_id (ON DELETE CASCADE) |  |
| issue_title  | TEXT        | NN                                           |       |
| issue_code   | TEXT        | NN                                           |       |
| details      | TEXT        |                                              |       |
| status       | TEXT        | NN, DEFAULT 'BACKLOG', CHECK                 | BACKLOG, IN_PROGRESS, DONE |
| assignee_id  | UUID        | FK -> users.user_id                          | must be project member, enforced in code |
| status_changed_at | TIMESTAMP |                                           | set on status change |
| modified_at  | TIMESTAMP   |                                              | set on update |
| created_at   | TIMESTAMP   | NN, DEFAULT now()                            |       |

Additional Constraints and Indexes:
 - CHECK (status IN ('BACKLOG', 'IN_PROGRESS', 'DONE'))
    - may abstract, see potential enhancements at end of doc
 - UK (project_id, issue_code)
    - enforce unique issue_code per project
    - can support filtering issues by project (prefer explicit index below)
 - INDEX (project_id, status)
    - supports filtering issues by status within project
    - can support filtering issues by project

### comments

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| comment_id   | UUID        | PK                                           |       |
| author_id    | UUID        | NN, FK -> users.user_id                      |       |
| issue_id     | UUID        | NN, FK -> issues.issue_id (ON DELETE CASCADE) |      |
| comment      | TEXT        | NN                                           |       |
| modified_at  | TIMESTAMP   |                                              | set on update |
| created_at   | TIMESTAMP   | NN, DEFAULT now()                            |       |
| deleted_at   | TIMESTAMP   | DEFAULT NULL                                 | soft delete |

Additional Constraints and Indexes:
 - INDEX (issue_id, created_at)
    - supports filtering comments by issue with oldest first (comment display per issue)

### notifications

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| notif_id     | UUID        | PK                                           |       |
| actor_id     | UUID        | FK -> users.user_id                          | nullable for system notifs |
| entity_type  | TEXT        | NN                                           |       |
| entity_id    | UUID        |                                              | nullable for deleted entities |
| action       | TEXT        | NN                                           | see notification_templates.action |
| message      | TEXT        | NN                                           |       |
| created_at   | TIMESTAMP   | NN, DEFAULT now()                            |       |

Additional Constraints and Indexes:
 - INDEX (created_at DESC)
 - CHECK (entity_type in ('PROJECT', 'ISSUE', 'COMMENT', 'INVITE'))
 - Check in code, action is in notification_templates.action

## notification_templates

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| action       | TEXT        | PK                                           | examples: 'COMMENT_DELETED', 'ISSUE_ASSIGNED' |
| template     | TEXT        |                                              | filled by template system (Mustache for MVP) |

## sent_notifications

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| recipient_id | UUID        | CPK, FK -> users.user_id                     | first of CPK |
| notif_id     | UUID        | CPK, FK -> notifications.notif_id            |       |
| seen_at      | TIMESTAMP   |                                              | set on notification view |

### invitations

| Column       | Type        | Constraints                                  | Notes |
|--------------|-------------|----------------------------------------------|-------|
| invite_id    | UUID        | PK                                           |       |
| sender_id    | UUID        | FK -> users.user_id, NN                      |       |
| recipient_id | UUID        | FK -> users.user_id, NN                      |       |
| project_id   | UUID        | FK -> projects.project_id, NN                |       |
| status       | TEXT        | NN, CHECK                                    | PENDING, ACCEPTED, REJECTED, REVOKED |
| responded_at | TIMESTAMP   |                                              | set on status change |
| sent_at      | TIMESTAMP   | NN, DEFAULT now()                            |       |
| seen_at      | TIMESTAMP   |                                              | set on notification view or invitations opened |

Additional Constraints and Indexes:
 - CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'REVOKED'))
 - UK (project_id, recipient_id) WHERE status = 'PENDING'
    - enforces one pending invite per project/recipient
 - INDEX (recipient_id, status)
    - supports filtering by recipient to display all invitations
    - can support filtering per recipient by status (likely to display pending incoming invites)
 - INDEX (project_id, status)
    - supports filter by project to display outgoing invitations
    - can support filtering outgoing invites by status


## Deletion Behavior

For MVP, deletion behavior is kept intentionally simple and restrictive. Development focus will expand post-MVP to be more courteous towards deletions.

 - Users
    - Deactivate/soft delete only
    - Deactivate blocked if the user owns a project (enforced in application logic)
    - Issues and comments stay, list creator/author as deactivated
    - Keep entries in project_contributors / mark deactivated in project member lists
    - Assigned issues are unassigned
 - Projects
    - Hard delete
    - Delete cascades (issues, comments, project_contributors, invitations)
    - Delete corresponding notifications (from application logic)
 - Issues
    - Hard delete
    - Delete cascades (comments)
    - Delete corresponding notifications (except notifications indicating its deletion)
 - Comments
    - Soft delete
    - Comment row remains for ordering; content removed from UI; UI shows “Comment deleted.”
    - Delete corresponding notifications (except notifications indicating its deletion)
 - Invitations
    - No direct delete option, only revoke
    - Revoking or deletion via project deletion deletes the corresponding notification
 - Notifications
    - No direct delete option for users


## Potential Enhancements

 - introduce an issue_statuses table linked by issues.status_id foreign key
	- intentionally excluded for MVP
	- enables later implementation of status tracking metadata and custom issue workflows
	- additionally deferred to demonstrate schema migration post-MVP
 - introduce a dedicated index for projects: (owner_id, modified_at DESC)
    - supports user dashboard displaying owned projects in order of recently modified
 - introduce an issue index: (assignee_id, project_id, status)
    - supports user dashboard displaying a users assigned issues
    - can support project dashboard displaying a users assigned issues at the top of each status column
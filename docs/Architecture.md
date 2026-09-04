# Architecture
This document serves as a basic roadmap subject to change, and will be updated as the project evolves.

## 1. Project Structure (Early, TBD)
```
Issue-Tracker/
├── backend/              # Contains all server-side code and APIs
│   ├── src/              # Main source code for backend services
│   │   ├── api/          # API endpoints and controllers
|   |   |   ├── errors
|   |   |   ├── middleware
|   |   |   ├── queries
|   |   |   └── routes
│   │   ├── db/           # Database types and services
|   |   |   └── services/ # DB services
|   |   └── types/        # DB types and enums
│   │    
│   └── tests/            # Backend unit and integration tests
│       ├── middleware/         
│       └── integration/
├── frontend/             # Contains all client-side code for user interfaces
│   ├── src/              # Main source code for frontend applications
│   │   ├── api/          # Access backend API
│   │   ├── auth/         # 
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # 
│   │   └── pages/        # Application pages/views
│   └── tests/            # Frontend unit and E2E tests
│       ├── ui/         
│       ├── unit/         
│       └── e2e/
├── supabase/             # Supabase / DB setup
│   ├── test_setup/       # auth.users table setup for tests against bare postgres
│   └── migrations/       # DB migrations
├── shared/               # Shared Zod schemas and types, published as @issue-tracker/shared
│   ├── src/
│   │   ├── tables/       # Per-resource schemas and inferred types
│   │   ├── commonSchemas.ts   # Shared primitives (id, getById, etc.)
│   │   └── index.ts           # Package entry point — re-exports all schemas/types
│   └── dist/             # Compiled output (ESM), consumed by backend and frontend
├── docs/                 # Architecture, requirements, and test plan
│   └── diagrams/         # Diagrams used in documentation
├── .github/workflows/    # Github Actions .yml
├── .gitignore            # Ignored files and folders
├── LICENSE               # MIT license
└── README.md             # Project overview and quick start guide
```
## 2. System Diagram

![Issue Tracker System Diagram](system-diagram.png)

## 3. Core Components

### 3.1 Frontend

**Issue tracker web page** name TBD

The interface through which users interact with the system. Allows users to manage their profile, view project dashboards, and add/modify/delete issues.

**Technologies:** React, TypeScript, HTML/CSS

**Deployment:** TBD, likely Vercel

### 3.2 Backend

**Issue Tracker API**

API handling data transactions between the frontend and the database.

**Technologies:** Node.js, TypeScript

**Deployment:** TBD, likely Railway

## 4. Data Stores

### 4.1 Primary database

**Type:** Supabase Postgres

**Access:** Backend API via Supabase client / Postgres adapter

**Purpose:** Store issues, projects, and basic account information

## 5. Authentication

**Provider:** Supabase Auth (frontend login/session via Supabase JS client)

**Backend verification:** JWT signature verified locally on each request via the shared Supabase JWT secret — no network call to Supabase per request. `authenticateUser` middleware attaches the decoded payload to `req.user`; `req.user.sub` matches `profiles.id` (auto-created via trigger on signup).

## 6. Authorization

**Model:** Relationship-based, not role-based — no static user roles. Each rule checks the requester's relationship to the specific resource: project creator, contributor, issue creator, assignee, invite sender/recipient.

**Implementation:** Composable rule predicates (`isProjectCreator`, `isProjectMember`, `isAssignee`, etc.), combined via `anyOf`/`allOf`, enforced per-route through a `requireRule` middleware. Resource loaders (`loadProject`, `loadIssue`, etc.) run first and populate `res.locals` for the rules to check.

## 7. Data Model

Will use a relational model with PostreSQL through Supabase

### Core tables include:

**profiles**
Stores: User profiles
Relationships:
 - projects (as creator): one-to-many
 - projects (as contributor): many-to-many (through project_contributors)
 - issues (creator): one-to-many
 - issues (assignee): one-to-many
 - comments: one-to-many
 - Future consideration: notifications (actor): one-to-many
 - Future consideration: sent_notifications (recipient): one-to-many
 - invites (sender): one-to-many
 - invites (recipient): one-to-many

**project_contributors**
Stores: junction table tracking to match contributing users with projects
Relationships:
- profiles: many-to-one
- projects: many-to-one

**projects**
Stores: Workspaces to group issues by
Relationships: 
 - profiles (creator): many-to-one
 - profiles (contributors): many-to-many (through project_contributors)
 - issues: one-to-many
 - Future consideration: notifications: one-to-many (optional, polymorphic in code)

**issues**
Stores: Single issues with relevant details
Relationships:
 - profiles (creator): many-to-one
 - profiles (assignee): many-to-one
 - projects: many-to-one
 - comments: one-to-many
 - Future consideration: notifications: one-to-many (optional, polymorphic in code)

**comments**
Stores: User-created comments left in response to issues
Relationships:
 - profiles: many-to-one
 - issues: many-to-one
 - Future consideration: notifications: one-to-many (optional, polymorphic in code)

**Future consideration: notifications**
Stores: In-app notification data
Relationships:
 - profiles (actor): many-to-one
 - invites | projects | issues | comments: many-to-one (optional polymorphic relationship, enforced in code)

**Future consideration: notification_templates**
Stores: Templates for defining notification messages

**Future consideration: sent_notifications**
Stores: Which notifications are sent to which users, and when they were seen
Relationships:
 - profiles (recipient): many-to-one
 - notifications: many-to-one

**invites**
Stores: Project invites sent from a project owner to another user
Relationships:
 - profiles (sender/project owner): many-to-one
 - profiles (recipient): many-to-one
 - projects: many-to-one
 - Future consideration: notifications: one-to-many (optional, polymorphic in code)

## 8. CI/CD

**CI:** GitHub Actions will run tests on every PR, formatting checks on PR and push

**CD:** On merge to main, frontend and backend automatically deployed to production

## 9. Testing Strategy

Detailed testing strategy found in `Test_Strategy.md`

### 9.1 Testing Frameworks

**Unit and Integration:** Vitest
**E2E:** Playwright
**API:** Vitest + Supertest
**UI:** React testing library

## 9. Future Considerations
- Role-based permissions

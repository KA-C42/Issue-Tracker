# Architecture
This document serves as a basic roadmap subject to change, and will be updated as the project evolves.

## 1. Project Structure (Early, TBD)
```
Issue-Tracker/
├── backend/              # Contains all server-side code and APIs
│   ├── src/              # Main source code for backend services
│   │   ├── api/          # API endpoints and controllers
│   │   ├── services/     # Business logic and service implementations
│   │   ├── models/       # Database models/schemas
│   │   └── utils/        # Backend utility functions
│   ├── config/           # Backend configuration files
│   └── tests/            # Backend unit and integration tests
│       ├── unit/         
│       └── integration/
├── frontend/             # Contains all client-side code for user interfaces
│   ├── src/              # Main source code for frontend applications
│   │   ├── components/   # Reusable UI components
│   │   └── pages/        # Application pages/views
│   ├── public/           # Publicly accessible assets (e.g., index.html)
│   └── tests/            # Frontend unit and E2E tests
│       ├── unit/         
│       └── e2e/
├── shared/               # Shared code used by both frontend and backend
│   ├── types/            # Shared TypeScript/interface definitions
│   └── utils/            # General utility functions
├── docs/                 # Architecture, requirements, and test plan
│   └── diagrams/         # Diagrams used in documentation
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

**Provider:** Supabase Auth (further details TBD)

Supabase Auth will handle user registration, login, session management, and token generation.

## 6. Data Model

Will use a relational model with PostreSQL through Supabase

### Core tables include:

**users**
Stores: User profiles
Relationships:
 - projects (as creator): one-to-many
 - projects (as contributor): many-to-many (through project_contributors)
 - issues (creator): one-to-many
 - issues (assignee): one-to-many
 - comments: one-to-many
 - notifications (actor): one-to-many
 - sent_notifications (recipient): one-to-many
 - invitations (sender): one-to-many
 - invitations (recipient): one-to-many

**project_contributors**
Stores: junction table tracking to match contributing users with projects
Relationships:
- users: many-to-one
- projects: many-to-one

**projects**
Stores: Workspaces to group issues by
Relationships: 
 - users (creator): many-to-one
 - users (contributors): many-to-many (through project_contributors)
 - issues: one-to-many
 - notifications: one-to-many (optional, polymorphic in code)

**issues**
Stores: Single issues with relevant details
Relationships:
 - users (creator): many-to-one
 - users (assignee): many-to-one
 - projects: many-to-one
 - comments: one-to-many
 - notifications: one-to-many (optional, polymorphic in code)

**comments**
Stores: User-created comments left in response to issues
Relationships:
 - users: many-to-one
 - issues: many-to-one
 - notifications: one-to-many (optional, polymorphic in code)

**notifications**
Stores: In-app notification data
Relationships:
 - users (actor): many-to-one
 - invitations | projects | issues | comments: many-to-one (optional polymorphic relationship, enforced in code)

**notification_templates**
Stores: Templates for defining notification messages

**sent_notifications**
Stores: Which notifications are sent to which users, and when they were seen
Relationships:
 - users (recipient): many-to-one
 - notifications: many-to-one

**invitations**
Stores: Project invitations sent from a project owner to another user
Relationships:
 - users (sender/project owner): many-to-one
 - users (recipient): many-to-one
 - projects: many-to-one
 - notifications: one-to-many (optional, polymorphic in code)

## 7. CI/CD

**CI:** GitHub Actions will run tests on every PR, formatting checks on PR and push

**CD:** On merge to main, frontend and backend automatically deployed to production

## 8. Testing Strategy

Detailed testing strategy found in `Test_Strategy.md`

### 8.1 Testing Frameworks

**Unit and Integration:** Jest
**E2E:** Playwright
**API:** Jest + Supertest + Postman/Newman

## 9. Future Considerations
- Role-based permissions

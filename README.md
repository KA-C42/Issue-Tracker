# Issue-Tracker

## Overview
A lightweight issue tracker for managing shared projects and issues among individuals and small teams. It is built as a full-stack web application with a focus on clear requirements, thorough testing, and a structured development process. Currently in the documentation phase.


## MVP Features
 - User Accounts & Authentication: Account creation, authentication, and authorization based on project roles.
 - Project Management: Shared projects with a single owner and invited contributors.
 - Issue Tracking (Kanban-style): Issue creation, editing, assignment, and status tracking via a Backlog / In Progress / Done kanban view.
 - User Dashboard: Displays account info and project lists.
 - Project Dashboard: Displays member lists and the issue board.
 - Issue Comments: A comment system with create, edit, and delete support.
 - In-App Notifications: Notifications for project invitations and key project and issue events.


## Documentation
- **Requirements:** Scope, assumptions, functional and non-functional requirements, and acceptance criteria  
  [docs/Requirements.md](docs/Requirements.md)
- **Architecture:** High-level system structure, core components, technology choices, and data model  
  [docs/Architecture.md](docs/Architecture.md) (early / evolving)
- **Test Strategy:** Testing approach and test levels  
  [docs/Test_Strategy.md](docs/Test_Strategy.md) 
- **Schema:** Database tables, relationships, and key constraints
  [docs/Schema.md](docs/Schema.md)


## Tech Stack
Full-stack web application built with React, Node.js/TypeScript, and Supabase (Auth + PostgreSQL). Automated testing includes unit, integration, API, and end-to-end tests, with CI handled via GitHub Actions.

**Frontend:** React, TypeScript

**Backend:** Node.js, TypeScript

**Backend Services:** Supabase (Auth + PostgreSQL)

**Testing:** Jest (unit & integration), Supertest (API whitebox), Playwright (E2E)

**CI:** GitHub Actions


## Tooling & Code Quality
CI checks planned, enforced once scaffolding in place  
- ESLint + Prettier enforced locally (on save)
- CI checks on PR:
  - TypeScript typecheck
  - Linting (ESLint)
  - Formatting (Prettier)
  - Automated tests
- CI checks on push:
  - Formatting (Prettier)



## Project Status
- [x] Requirements defined
- [x] High-level architecture defined
- [x] Database schema defined
- [x] Test strategy defined
- [ ] Backend / frontend scaffolding
- [ ] CI pipeline (typecheck, lint, tests)
- [ ] Backend feature implementation
- [ ] Frontend feature implementation

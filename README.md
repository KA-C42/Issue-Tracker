# Issue Tracker

A full-stack issue tracker for individuals and small teams: shared projects, username-based invites, a drag-and-drop kanban board, and issue comments, with permissions based on each user's relationship to a project. Built with a focus on clear requirements, risk-driven testing, and a structured development process.

**Live demo:** [issue-tracker-delta-five.vercel.app](https://issue-tracker-delta-five.vercel.app). Use the **Try a demo account** button on the sign-in page to get a private, pre-filled workspace without signing up.

[![Quality Checks](https://github.com/KA-C42/Issue-Tracker/actions/workflows/quality-checks.yml/badge.svg)](https://github.com/KA-C42/Issue-Tracker/actions/workflows/quality-checks.yml)
[![Tests](https://github.com/KA-C42/Issue-Tracker/actions/workflows/tests.yml/badge.svg)](https://github.com/KA-C42/Issue-Tracker/actions/workflows/tests.yml)

<!-- todo: add gif of the site!!-->

## Try the demo

Each demo visitor gets their own guest account, three fake teammates, and a seeded workspace:

- **Portfolio Website:** a project you own. Edit it, add issues, remove a member, or revoke a pending invite.
- **Mobile App Launch:** a project you contribute to. Claim the unassigned issue, then try moving one that belongs to someone else.
- **Hire Kacy:** a pending invite on your dashboard. Accept it to join.

The data is yours alone, so edit or delete anything.

## Features

- **Accounts:** email/password sign-up and sign-in through Supabase Auth, one-click guest accounts, and username editing from the navbar.
- **Projects:** one owner and any number of contributors. Owners edit, delete, and remove members; contributors can leave.
- **Invites:** any project member can invite users by username. Recipients accept or decline from their dashboard, and the sender or owner can revoke a pending invite.
- **Kanban board:** Backlog / In Progress / Done columns with drag-and-drop. Status changes apply optimistically and roll back if the API rejects them.
- **Issues:** create, edit, assign, and delete, each with a per-project code such as `SITE-3`. Any member can claim an unassigned issue.
- **Comments:** add, edit, and delete on each issue.
- **Dashboard:** owned and contributing projects with at-a-glance counts, plus pending invites.

## Architecture

Key decisions:

- **Supabase is only auth and a hosted database.** Its Data API is disabled, so the Express API is the single path to the data and the single place authorization happens.
- **Stateless token checks.** The API verifies Supabase-issued JWTs with `jose` against the project's cached public keys, with no call to Supabase per request.
- **Relationship-based authorization.** There are no global roles. Each route composes rules such as `isProjectCreator`, `isAssignee`, and `isSender` with `anyOf`/`allOf` in a `requireRule` middleware, after loader middleware fetches the resource.
- **Invariants live in the database.** Triggers create a profile on sign-up, add owners as members, block owner removal, turn accepted invites into memberships, unassign a departing member's issues, and number issues per project. A partial unique index allows one pending invite per user per project.
- **One schema, both sides.** `@issue-tracker/shared` holds Zod schemas and inferred types, used by the API's request validation and the frontend's forms.
- **Same-origin API.** The frontend calls relative `/api/*` paths, which Vite proxies in development and Vercel rewrites to Railway in production, so no CORS setup is needed.
- **A private demo per visitor.** Guests are Supabase anonymous users, and a trigger on `auth.users` seeds each one a workspace, so there's no shared demo login to vandalize.

More detail: [Architecture](docs/Architecture.md) · [Schema](docs/Schema.md)

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, shadcn/ui (Base UI), React Hook Form, dnd-kit |
| Backend | Node.js, Express 5, TypeScript, node-postgres (parameterized SQL, no ORM), jose |
| Shared | Zod schemas and inferred types in an npm workspace package |
| Auth & data | Supabase Auth, PostgreSQL (hosted on Supabase) |
| Testing | Vitest, Supertest, React Testing Library, Playwright |
| Tooling | ESLint, Prettier, GitHub Actions, Docker Compose |
| Hosting | Vercel (frontend), Railway (API), Supabase (auth and database) |

## Testing

Testing is risk-driven rather than coverage-driven, per the [test strategy](docs/Test_Strategy.md): authorization and data integrity get the most attention.

- **Backend (200+ tests):** Vitest + Supertest integration tests run the API routes against a real Postgres database, reset between tests. They check status codes, authorization rules, and the rules enforced by triggers and constraints. JWTs are signed with locally generated keys, so tests don't depend on Supabase Auth. Middleware has its own unit tests.
- **Frontend (70+ tests):** component tests with React Testing Library, plus unit tests for the API client, permission helpers, and kanban logic.
- **End-to-end:** Playwright covers sign-up through project creation and the guest demo flow, in Chromium, Firefox, and WebKit.

## CI/CD

- **Quality checks** run on every push and on PRs into `main`: ESLint, Prettier, typecheck, and production builds of both apps.
- **Tests** run on PRs into and pushes to `main`. The workflow starts a local Supabase stack with the Supabase CLI, runs backend Vitest, frontend Vitest, and Playwright, and uploads the Playwright report as an artifact.
- **Deploys** come from `main` and wait on CI: Railway holds the API deploy until checks pass, and Vercel Deployment Checks gate the production frontend.

## API

REST endpoints for profiles, projects, contributors, issues, comments, and invites. Every route except `/health` requires a Supabase JWT in an `Authorization: Bearer` header.

- **Local:** `http://localhost:3000`
- **Deployed:** `https://issue-tracker-delta-five.vercel.app/api` (proxied to Railway)

Full reference: [docs/API.md](docs/API.md)

## Running locally

Requires Node.js 20.19+, Docker, and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
npm ci
npm run build -w shared   # backend and frontend import the compiled shared package
supabase start            # local Auth + Postgres in Docker, with migrations applied
```

Create the env files, taking values from `supabase status`:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_AUTH_URL=http://127.0.0.1:54321/auth/v1/.well-known/jwks.json

# frontend/.env (template in frontend/.env.example)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from supabase status>
```

`npm run dev` then starts the shared-package watcher, the API on port 3000, and the frontend on http://localhost:5173.

### Running tests

```bash
# Backend: throwaway Postgres 17 container on port 12345, migrations applied
npm run testdb:up
npm run test:backend
npm run testdb:down

# Frontend: Vitest, then Playwright (needs the local Supabase stack and both .env files)
# First run only: cd frontend && npx playwright install
npm run test:frontend

# Everything: lint, typecheck, format check, and all tests
npm run checks
```

Backend tests read `backend/.env.test`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:12345/postgres
# Placeholder: tests replace the JWKS lookup with locally generated keys
SUPABASE_AUTH_URL=http://localhost/jwks
```

## Documentation

- [Requirements](docs/Requirements.md): scope, assumptions, functional and non-functional requirements, and acceptance criteria
- [Architecture](docs/Architecture.md): system structure, core components, technology choices, and data model
- [Schema](docs/Schema.md): tables, relationships, and key constraints
- [API](docs/API.md): endpoints, authentication, and request/response reference
- [Test Strategy](docs/Test_Strategy.md): testing approach and test levels

## Project status

The MVP is complete and deployed.

- [x] Requirements, architecture, schema, and test strategy
- [x] Backend: all MVP routes, with integration tests
- [x] Frontend: all MVP screens
- [x] CI: quality checks and automated tests
- [x] Deployment with CI-gated CD (Vercel + Railway)
- [x] Guest demo with per-visitor seeded workspaces
- [ ] Scheduled cleanup of old guest accounts
- [ ] "Assigned to me" issue board on the dashboard
- [ ] Account deactivation in the UI (the API route exists)
- [ ] Validation pass and visual polish
- [ ] Wider E2E coverage and accessibility testing

## License

[MIT](LICENSE)

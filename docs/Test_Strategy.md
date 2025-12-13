# Test Strategy — Issue Tracker (MVP)

## 1. Purpose & Quality Goals
The goal of testing is to build confidence that core user flows are secure, reliable, and predictable for the MVP.

Primary quality risks:
 - Unauthorized access to project or user data
 - Silent failures involving the API or DB
 - Data corruption during CRUD operations
 - Data corruption during concurrent use
 - Incorrect UI states for core workflows


## 2. Scope
**In scope:**
 - Authentication and authorization 
 - Project, issue, and comment CRUD
 - Contributor invites/access changes
 - Core user workflows (happy path and common failures)
 - Error handling with user-visible feedback for bad requests
 - Basic accessibility checks (keyboard navigation, visible focus, and perceivable error states)

**Out of scope:**
 - Stress testing
 - Penetration testing
 - Advanced accessibility

## 3. Test Levels & Responsibilities
Testing is focused on high-risk areas rather than achieving a specific code coverage goal

**Unit Tests**
 - Business logic
 - Isolated and deterministic functions

**Integration Tests**
 - Backend/DB interactions
 - Data persistence and integrity (ownership, relationships, constraints)
 - Failure scenarios (partial writes, rejected operations, auth boundaries)

**API Tests**
 - Request validation and authorization
 - Expected responses and status codes
 - Handling invalid inputs and unauthorized requests

**E2E Tests**
 - Core user flows (happy paths and common errors)
 - Cross-browser coverage

**Manual / Exploratory**
 - Visuals/layout
 - Responsiveness
 - Low risk edge cases

## 4. Environments & CI Gates
 - Local
    - Unit, integration, and API tests are run locally during development
    - E2E and manual testing are performed locally for major changes and when new user flows are introduced
 - CI (GitHub Actions)
    - All automated tests are executed on every pull request
    - Branch protection prevents merging into shared branches unless all CI checks pass
    - Flaky tests are treated as defects and addressed immediately

## 5. Coverage Philosophy
 - Coverage is risk-driven, not percentage-driven
 - High-risk requirements must have automated coverage at an appropriate layer
 - E2E tests are intentionally limited to avoid duplication and flakiness

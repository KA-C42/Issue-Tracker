# Requirements
This project is a simplified issue tracker supporting shared projects and issues between users. It is intended for individuals and small teams requiring project management and issue tracking. This document details the functional and non-functional requirements, along with certain assumptions and what is and isn't in scope.


## 1. Core Features
- Create user accounts
- Create and share projects with users
- Create and track issues within projects


## 2. User Roles
* Standard User  
    * Project member  
        * Project owner  
        * Project contributor  
        * Issue creator  
        * Issue assignee  
        * Comment author  


## 3. Scope

### Goal
To create a lightweight issue-tracking tool for sharing, managing, and tracking projects and issues among small teams.

### In Scope
 - Account creation, authentication, and authorization
 - Project management and sharing
 - Issue management, assignment, and tracking
 - Issue comment system
 - In-app notifications
 - User Dashboard (account info, project creation/lists, notifications)
 - Project Dashboard (project details, kanban view, members, issues, comments)

### Out of Scope
 - Account management
    - Changing username, email, or password
 - External notifications
 - File attachments
 - Issue tags/categories
 - Mobile App
 - Text search
 - Offline functionality
 - Custom roles


## 4. Assumptions
 - Users have a stable internet connection
 - Users remember their own login credentials (password recovery not supported in initial release)
 - Supabase Auth and Supabase PostgreSQL remain available. Outages and/or degradation of these services are considered an external failure
 - Users already possess valid accounts before being invited to or creating projects


## 5. Epics -> User Stories -> Acceptance Criteria

### Epic 1: User Accounts and Authentication / AUTH

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 – As a user, I want to create an account so that I can access the system.</strong></summary>

  Acceptance Criteria:  
  1 - User can create a new account  
  2 - Registration requires an unused email  
  3 - Registration requires a password  
  4 - Invalid email/password shows an error  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 – As a user, I want a unique username so my account can be identified.</strong></summary>

  Acceptance Criteria:  
  1 – Username must be unique  
  2 – Invalid username shows an error  
  3 – Username is displayed as primary identifier  
  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a user, I want to log in to my account so that I can return and re-access my account and projects</strong></summary>

  Acceptance Criteria:  
  1 - Login requires an email address or username  
  2 - Login requires a password  
  3 - User is authenticated with valid credentials and routed to the user's dashboard  
  4 - Attempting to use invalid credentials will display an error explaining the problem
  </details>

</details>

### Epic 2: Project Ownership and Contributions / PROJ

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 - As a user, I want to create a project with a unique name and optional description so that I can quickly recognize the project and important details</strong></summary>

  Acceptance Criteria:  
  1 - User can create a new project from the user dashboard  
  2 - Project requires a name that is unique amongst the users owned projects  
  3 - Attempting to use an invalid project name will display an error explaining the problem  
  4 - Project creation allows for an optional description  
  5 - The system displays confirmation upon successful creation

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 - As a user, I want to own the projects I create so that I maintain the highest authorization level within it</strong></summary>

  Acceptance Criteria:  
  1 - User creating the project is assigned as the project owner  
  2 - Project has exactly one owner
  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a project owner, I want to edit project details so that I can keep project information up to date</strong></summary>

  Acceptance Criteria:  
  1 - Project owner can edit project name (must be unique among other projects the user owns)  
  2 - Project owner can edit project description  
  3 - Attempting to use an invalid project name and/or description will display an error explaining the problem  
  4 - The system displays confirmation upon successful edit  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>4 - As a project owner, I want to view the participants and invitation status so that I can track who has access</strong></summary>

  Acceptance Criteria:  
  1 - Project owner can access a list of participants  
  2 - Project owner can view invitation status (pending, accepted, rejected, revoked)  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>5 - As a project owner, I want to manage contributor invitations so that I can invite collaborators to work with</strong></summary>

  Acceptance Criteria:  
  1 - Project owner can invite other users to be project contributors  
  2 - Contributor invitations require a valid email address or username format matching another user  
  3 - Upon successful or failing invitation, success/failure message/error is displayed to project owner  
  4 - Project owner can revoke contributor invitations  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>6 - As a project owner, I want to remove contributors from the project so that I can revoke access</strong></summary>

  Acceptance Criteria:  
  1 - Project owner can remove project contributors from the project  
  2 - Removal of project contributors prompts the project owner for confirmation  
  3 - Removed project contributor is notified upon removal and access to project revoked  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>7 - As a user, I want to join another user's project as a contributor so that I can contribute to a project with a team</strong></summary>

  Acceptance Criteria:  
  1 - User can access a list of project invitations  
  2 - User can accept or reject project invitations  
  3 - Upon accepting a project invitation, user is granted access as a contributor  
  4 - Upon rejecting an invitation, the invitation is no longer interactable  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>8 - As a project contributor, I want to forfeit contributor status on another user's project so that I can keep my project list current</strong></summary>

  Acceptance Criteria:  
  1 - Project Contributor can leave a project  
  2 - Upon leaving a project, the user's contributor status is revoked for that project and the project owner is notified  

  </details>

</details>

### Epic 3: Issues / ISSU

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 - As a project member, I want to create an issue so that I can record and share a task with other project members</strong></summary>

  Acceptance Criteria:  
  1 - The project dashboard allows members to create a new issue  
  2 - Issue requires a title and unique code per project
  3 - Issue creation has optional fields: description, code, assignee (selected from list of project members), status (selected from "Backlog", "In Progress", "Done")  
  4 - Issue is automatically assigned a unique code if none is given  
  5 - Default status is "Backlog"  
  6 - If a project contributor creates an issue with the status "In Progress", the issue is assigned to them  
  7 - If a project owner creates an issue with that status "In Progress", they must choose an assignee  
  8 - An issue has one creator 
  9 - On successful creation, the form closes, success message displayed, and issue added to project  
  10 - On unsuccessful creation, failure message is displayed explaining the error

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 - As an issue creator or project owner, I want to modify issue details so that I can keep issue information current</strong></summary>

  Acceptance Criteria:  
  1 - The expanded issue modal allows the issue creator and project owner to edit its fields  
  2 - On attempting to save invalid input, edit is rejected and error message displayed  
  3 - On successful edit, changes are visible  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a project member, I want to claim an unassigned issue so that I can communicate my planned work with other project members</strong></summary>

  Acceptance Criteria:  
  1 - From the issue modal on unassigned issues, a project member can assign themself to it  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>4 - As an issue creator or project owner, I want to delete an issue so that I can ensure relevance of listed issues</strong></summary>

  Acceptance Criteria:  
  1 - From the issue modal, the issue creator or project owner can delete the issue  
  2 - Upon deletion, the issue assignee, issue creator, and project owner are notified  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>5 - As a project owner, I want to assign an issue so that project members know who is working on what</strong></summary>

  Acceptance Criteria:  
  1 - From the issue modal, a project owner can edit the assignee field  
  2 - Upon saving an assignee, the assignee is notified  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>6 - As an issue assignee, I want to change an issue's status so that I can share my progress with project members</strong></summary>

  Acceptance Criteria:  
  1 - From the issue modal, an issue assignee can change the status of an issue they are assigned to  
  2 - Upon saving a new status, the issue is moved to the corresponding category and datetime of the update is saved to the issue    

  </details>

</details>

### Epic 4: Comments / COMM

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 - As a project member, I want to create a comment so that I can leave relevant information and questions with issues</strong></summary>

  Acceptance Criteria:  
  1 - The issue modal prompts any project member for a comment  
  2 - Comments only require and allow a text input  
  3 - On attempting to save invalid input, creation is rejected and error message displays with explanation  
  4 - Upon saving, the comment is displayed with the issue modal along with the name of the comment author and datetime of posting  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 - As a comment author, I want to edit my comment so that I can keep the comment relevant and correct</strong></summary>

  Acceptance Criteria:  
  1 - A comment author can interact with their comment to begin editing it  
  2 - On attempting to save invalid input, edit is rejected and error message displays with explanation  
  3 - Upon saving, the edited content shown and comment marked as edited with the time of the most recent edit  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a comment author or project owner, I want to delete a comment so that I can protect the project from irrelevant or harmful comments</strong></summary>

  Acceptance Criteria:  
  1 - Comment author can access a delete option for comments owned by them  
  2 - Project owners can access a delete option for comments within projects they own  
  3 - Upon deletion, comment is removed  
  4 - If deleted by the project owner, comment author is notified  

  </details>

</details>

### Epic 5: User Dashboard / UDSH

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 - As a user, I want to log in to a dashboard displaying general account info and projects I am a member of so that I can understand my current work and access projects</strong></summary>

  Acceptance Criteria:  
  1 - An authenticated user can view and interact with their own dashboard  
  2 - Logging in routes an authenticated user to their own dashboard  
  3 - An unauthenticated user cannot view a user dashboard and is routed to a login/register screen  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 - As a user, I want to see and navigate to the projects I am a member of so that I can understand my current commitments</strong></summary>

  Acceptance Criteria:  
  1 - User dashboard displays all projects the authenticated user owns or contributes to  
  2 - Projects are separated into 2 sections: owned and contributing to  
  3 - Projects in the contributing to section include the username of the project owner  
  4 - Each displayed project includes a navigation option that leads to the dashboard for that project  
  5 - Each displayed project includes the project name  
  6 - For each project that has a description, the description is also displayed

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a user, I want to see my username and email address so that I can verify both that I am correctly logged in and the correct username to share with possible team members</strong></summary>

  Acceptance Criteria:  
  1 - User dashboard displays username and email address of the authenticated user    

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>4 - As a user, I want to view my notifications so that I can be informed about any changes and updates relevant to me and my work</strong></summary>

  Acceptance Criteria:  
  1 - User dashboard offers a "notifications" section  
  2 - Notification section lists notifications with brief summary and datetime   

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>5 - As a user, I want to view and respond to any pending contributor invitations so that I can join projects with a team</strong></summary>

  Acceptance Criteria:  
  1 - Notification section includes project invitations which include the project name and project owner name  
  2 - Project invitation notifications have interactable options to accept or reject an invitation  
  3 - Upon accepting an invitation, the user is added to the project as a contributor  
  4 - Upon accepting or rejecting an invitation, the project owner is notified and notification is no longer interactable  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>6 - As a user, I want to access a new-project form so that I can start creation of new projects</strong></summary>

  Acceptance Criteria:  
  1 - User dashboard offers a prompt to start creation of a new project  
  2 - Interacting with the new-project prompt opens a project creation form   

  </details>

</details>

### Epic 6: Project Dashboard / PDSH

<details style="margin-left: 20px;">
  <summary>User Stories</summary>

  <details style="margin-left: 20px;">
    <summary><strong>1 - As a project member, I want to view a project dashboard so that I can understand the project and its progress</strong></summary>

  Acceptance Criteria:  
  1 - An authorized user (authenticated user that is a member of the project) can view and interact with the project's dashboard  
  2 - An unauthorized user (authenticated user that is not a member of the project) cannot view or interact with the project's dashboard and is shown an "Unauthorized" screen  
  3 - An unauthenticated user is routed to a login/register screen  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>2 - As a project member, I want to see status columns dividing issues so that I can quickly understand the progress of each issue</strong></summary>

  Acceptance Criteria:  
  1 - Project Dashboard displays a kanban-like board with three columns labeled "Backlog", "In Progress", and "Done" respectively  
  2 - Each column includes all issues within the project that have the corresponding status tag  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>3 - As a project member, I want to view a list of project members so that I know who I am working with</strong></summary>

  Acceptance Criteria:  
  1 - Project Dashboard includes a Project Members section  
  2 - Project Members section lists all project members  
  3 - Project Members section clearly labels the project owner  

  </details>
 
  <details style="margin-left: 20px;">
    <summary><strong>4 - As a project member, I want to see issue cards including only feature code, assignee, and title so that I can have a rough understanding of the overall work to do without screen clutter</strong></summary>

  Acceptance Criteria:  
  1 - Project Dashboard initially displays issues as issue cards  
  2 - Issue cards only list the feature code, assignee, and title  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>5 - As a project member, I want to expand an issue card to a modal with full issue details and comments so that I can understand the issue in depth</strong></summary>

  Acceptance Criteria:  
  1 - Issue cards are interactable and expand into larger issue modal  
  2 - Issue modals display all fillable issue fields, as well as the issue creator, datetime created, and datetime of last status change  
  3 - Issue modal has visual indication that issue fields are editable when viewed by the issue creator or project owner  
  4 - Issue modal has visual indication that status and assignee are editable when viewed by the issue assignee  
  5 - Issue modals are collapsible back to issue cards  

  </details>

  <details style="margin-left: 20px;">
    <summary><strong>6 - As a project member, I want to access a "new issue" form so that I can start creation of a new issue</strong></summary>

  Acceptance Criteria:  
  1 - Project Dashboard prompts project members to create a new issue  
  2 - New issue prompt is interactable and opens a form with fillable issue fields  

  </details>

</details>


## 6. Non-Functional Requirements
1 - Projects, and the issues and comments within them, are only accessible to the project owner and added contributors
2 - The application should not handle or store raw passwords
3 -	The web app should operate normally on current and recent releases of WebKit-, Chromium-, and Firefox-based browsers on desktop platforms
4 -	When backend services fail, the user should see a clear error message explaining the error state and data should not be corrupted.
5 -	The platform should support at least 10 concurrent users at a time (to prove shared functionality while staying within affordable usage tiers)
6 -	The application should have minimal navigation with elements either clearly labeled or displayed as standardized symbols
7 -	The system should allow a user to log in and view their dashboard within 3 seconds under normal conditions
8 -	The system should handle CRUD updates and any other API/DB interactions within 1 second under normal conditions
9 -	The system should avoid using raw SQL to reduce the risk of SQL injection


## 7. Potential Enhancements
 - Password recovery
 - Transferring ownership of projects/issues
 - Local storage for some offline functionality
 - Custom status categories
 - Sentry error reporting
 - Drag-and-drop issues
 - Mobile-specific UI layout
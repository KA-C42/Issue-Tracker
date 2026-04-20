import { Application } from 'express'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  makeContributor,
  project,
  user,
  issue,
} from './createTestRows'

type seedVariedIssuesReturn = {
  mainProjectOwner: user
  projectContributor: user
  otherProjectOwner: user

  mainProject: project
  otherProject: project

  issues: issue[]
}

// prettier-ignore
async function seedVariedIssues(app: Application) {
    const mainProjectOwner = await createTestUser(app, 'mainProjectOwner')
    const projectContributor = await createTestUser(app, 'projectContributor')
    const otherProjectOwner = await createTestUser(app, 'otherProjectOwner')

    const mainProject = await createTestProject(app, mainProjectOwner.id, 'mainProject')
    const otherProject = await createTestProject(app, otherProjectOwner.id, 'otherProject')

    await makeContributor(app, projectContributor.id, mainProject.id)
    await makeContributor(app, projectContributor.id, otherProject.id)

    const issues = await Promise.all([
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'default'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'done, contributor assigned', projectContributor.id, 'DONE'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'done, owner assigned', mainProjectOwner.id, 'DONE'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'done, none assigned', undefined, 'DONE'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'backlog, contributor assigned', projectContributor.id, 'BACKLOG'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'backlog, owner assigned', mainProjectOwner.id, 'BACKLOG'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'backlog, none assigned', undefined, 'BACKLOG'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'in_progress, contributor assigned', projectContributor.id, 'IN_PROGRESS'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'in_progress, owner assigned', mainProjectOwner.id, 'IN_PROGRESS'),
        createTestIssue(app, mainProjectOwner.id, mainProject.id, 'in_progress, none assigned', undefined, 'IN_PROGRESS'),

        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP default'),
        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP done, contributor', projectContributor.id, 'DONE'),
        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP done, none', undefined, 'DONE'),
        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP in_progress, contributor', projectContributor.id, 'IN_PROGRESS'),
        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP backlog, owner', otherProjectOwner.id, 'BACKLOG'),
        createTestIssue(app, otherProjectOwner.id, otherProject.id, 'otherP backlog, contributor', projectContributor.id, 'BACKLOG')
    ])

    return {
        mainProjectOwner,
        projectContributor,
        otherProjectOwner,

        mainProject,
        otherProject,

        issues
    }
}

export { seedVariedIssues }
export type { seedVariedIssuesReturn }

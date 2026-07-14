import { Application } from 'express'
import {
  createTestIssue,
  createTestProject,
  createTestUser,
  makeContributor,
} from './createTestRows'
import { Issue, User, Project } from '../../../src/types/db'
import { createAuthToken } from './createAuthToken'

type seedVariedIssuesReturn = {
  mainProjectOwner: User
  projectContributor: User
  otherProjectOwner: User

  ownerToken: string
  otherOwnerToken: string

  mainProject: Project
  otherProject: Project

  issues: Issue[]
}

// prettier-ignore
async function seedVariedIssues(app: Application) {
    const mainProjectOwner = await createTestUser('boss@work.work')
    const projectContributor = await createTestUser('worker@work.work')
    const otherProjectOwner = await createTestUser('assistantBoss@work.work')
    const ownerToken = await createAuthToken(mainProjectOwner.id)
    const otherOwnerToken = await createAuthToken(otherProjectOwner.id)

    const mainProject = await createTestProject(app, ownerToken, 'mainProject')
    const otherProject = await createTestProject(app, otherOwnerToken, 'otherProject')

    await makeContributor(projectContributor.id, mainProject.id)
    await makeContributor(projectContributor.id, otherProject.id)

    const issues = await Promise.all([
        createTestIssue(app, ownerToken, mainProject.id, 'default'),
        createTestIssue(app, ownerToken, mainProject.id, 'done, contributor assigned', projectContributor.id, 'DONE'),
        createTestIssue(app, ownerToken, mainProject.id, 'done, owner assigned', mainProjectOwner.id, 'DONE'),
        createTestIssue(app, ownerToken, mainProject.id, 'done, none assigned', undefined, 'DONE'),
        createTestIssue(app, ownerToken, mainProject.id, 'backlog, contributor assigned', projectContributor.id, 'BACKLOG'),
        createTestIssue(app, ownerToken, mainProject.id, 'backlog, owner assigned', mainProjectOwner.id, 'BACKLOG'),
        createTestIssue(app, ownerToken, mainProject.id, 'backlog, none assigned', undefined, 'BACKLOG'),
        createTestIssue(app, ownerToken, mainProject.id, 'in_progress, contributor assigned', projectContributor.id, 'IN_PROGRESS'),
        createTestIssue(app, ownerToken, mainProject.id, 'in_progress, owner assigned', mainProjectOwner.id, 'IN_PROGRESS'),
        createTestIssue(app, ownerToken, mainProject.id, 'in_progress, none assigned', undefined, 'IN_PROGRESS'),

        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP default'),
        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP done, contributor', projectContributor.id, 'DONE'),
        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP done, none', undefined, 'DONE'),
        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP in_progress, contributor', projectContributor.id, 'IN_PROGRESS'),
        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP backlog, owner', otherProjectOwner.id, 'BACKLOG'),
        createTestIssue(app, otherOwnerToken, otherProject.id, 'otherP backlog, contributor', projectContributor.id, 'BACKLOG')
    ])

    return {
        mainProjectOwner,
        projectContributor,
        otherProjectOwner,

        ownerToken,
        otherOwnerToken,

        mainProject,
        otherProject,

        issues
    }
}

export { seedVariedIssues }
export type { seedVariedIssuesReturn }

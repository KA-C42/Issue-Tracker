import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { AppError } from '../../src/api/errors/AppError'
import { getProject } from '../../src/db/services/project.services'
import {
  loadComment,
  loadContributor,
  loadInvite,
  loadIssue,
  loadProfile,
  loadProject,
} from '../../src/api/middleware/loadRequest'
import {
  Project,
  Comment,
  Issue,
  Invite,
  Profile,
  ProjectContributor,
} from '@issue-tracker/shared'
import { getContributor } from '../../src/db/services/contributorServices'
import { getComment } from '../../src/db/services/commentServices'
import { getIssue } from '../../src/db/services/issueServices'
import { getInvite } from '../../src/db/services/inviteServices'
import { getProfile } from '../../src/db/services/userServices'

vi.mock('../../src/db/services/project.services.js')
vi.mock('../../src/db/services/contributorServices.js')
vi.mock('../../src/db/services/commentServices.js')
vi.mock('../../src/db/services/issueServices.js')
vi.mock('../../src/db/services/inviteServices.js')
vi.mock('../../src/db/services/userServices.js')

type FakeResponse = { locals: Record<string, any> }

describe('loadRequest', () => {
  let req: Request
  let res: FakeResponse
  let next: Mock

  beforeEach(() => {
    vi.clearAllMocks()

    req = {
      body: {},
      params: {},
    } as Request
    res = {
      locals: {
        validated: { project_id: randomUUID() },
      },
    }
    next = vi.fn()
  })

  it('successfully loads a resource onto res.locals[resource_type], then calls next()', async () => {
    const fillerProject = { title: 'Master Chef', code: 'J117' }
    vi.mocked(getProject).mockResolvedValueOnce(fillerProject as Project)

    const middleware = loadProject(
      (req, res) => res.locals.validated.project_id,
    )

    await middleware(req, res as Response, next)

    expect(getProject).toHaveBeenCalledWith(res.locals.validated.project_id)
    expect(res.locals.project).toMatchObject(fillerProject as Project)
    expect(next).toHaveBeenCalledWith()
  })

  it('calls next(new AppError) with the correct 404 message when not found and required', async () => {
    vi.mocked(getProject).mockResolvedValueOnce(null)

    const nya = 'nyahaha!'

    // loadProject always required when called
    // only loadContributor not required
    const middleware = loadProject((_req, _res) => nya)

    await middleware(req, res as Response, next)

    expect(getProject).toHaveBeenCalledWith(nya)
    expect(res.locals.project).toBeUndefined()
    expect(next).toHaveBeenCalledWith(new AppError('PROJECT_NOT_FOUND'))
  })

  it('calls next() without loading data when not found and not required', async () => {
    vi.mocked(getContributor).mockResolvedValueOnce(null)

    const filler = {
      project_id: '1',
      user_id: '2',
    }
    // loadContributor is the only loader not required to find a row
    const middleware = loadContributor((_req, _res) => filler)

    await middleware(req, res as Response, next)

    expect(getContributor).toHaveBeenCalledWith(
      filler.project_id,
      filler.user_id,
    )
    expect(res.locals.contributor).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })
})

describe('loadResource wrapper wiring', () => {
  let req: Request
  let res: FakeResponse
  let next: Mock

  beforeEach(() => {
    vi.clearAllMocks()

    req = {
      body: {},
      params: {},
    } as Request
    res = {
      locals: {
        validated: { project_id: randomUUID() },
      },
    }
    next = vi.fn()
  })

  it('loadComment calls getComment and sets res.locals.comment', async () => {
    const fillerComment = { id: 'c1', comment: 'nice bug report' }
    vi.mocked(getComment).mockResolvedValueOnce(fillerComment as Comment)

    const middleware = loadComment(() => 'comment-id')
    await middleware(req, res as Response, next)

    expect(getComment).toHaveBeenCalledWith('comment-id')
    expect(res.locals.comment).toMatchObject(fillerComment)
    expect(next).toHaveBeenCalledWith()
  })

  it('loadIssue calls getIssue and sets res.locals.issue', async () => {
    const fillerIssue: Issue = {
      project_id: '1',
      title: 'project',
      status: 'BACKLOG',
      id: '2',
      details: 'fix it',
      code: 3,
      created_at: '4',
      creator_id: '5',
      status_changed_at: '6',
      modified_at: '7',
    }
    vi.mocked(getIssue).mockResolvedValueOnce(fillerIssue)

    const middleware = loadIssue(() => 'issue-id')
    await middleware(req, res as Response, next)

    expect(getIssue).toHaveBeenCalledWith('issue-id')
    expect(res.locals.issue).toMatchObject(fillerIssue)
    expect(next).toHaveBeenCalledWith()
  })

  it('loadInvite calls getInvite and sets res.locals.invite', async () => {
    const fillerInvite: Invite = {
      id: 'invite',
      sender_id: 'sender',
      recipient_id: 'recipient',
      project_id: 'project',
      status: 'PENDING',
      sent_at: '1',
      status_changed_at: '2',
    }
    vi.mocked(getInvite).mockResolvedValueOnce(fillerInvite as Invite)

    const middleware = loadInvite(() => 'invite-id')
    await middleware(req, res as Response, next)

    expect(getInvite).toHaveBeenCalledWith('invite-id')
    expect(res.locals.invite).toMatchObject(fillerInvite)
    expect(next).toHaveBeenCalledWith()
  })

  it('loadProfile calls getProfile and sets res.locals.profile', async () => {
    const fillerProfile = { id: 'u1', username: 'chief117' }
    vi.mocked(getProfile).mockResolvedValueOnce(fillerProfile as Profile)

    const middleware = loadProfile(() => 'user-id')
    await middleware(req, res as Response, next)

    expect(getProfile).toHaveBeenCalledWith('user-id')
    expect(res.locals.profile).toMatchObject(fillerProfile)
    expect(next).toHaveBeenCalledWith()
  })

  it('loadContributor calls getContributor with unpacked keys and sets res.locals.contributor on success', async () => {
    const fillerContributor = { project_id: '1', user_id: '2' }
    vi.mocked(getContributor).mockResolvedValueOnce(
      fillerContributor as ProjectContributor,
    )

    const middleware = loadContributor(() => ({
      project_id: '1',
      user_id: '2',
    }))

    await middleware(req, res as Response, next)

    expect(getContributor).toHaveBeenCalledWith('1', '2')
    expect(res.locals.contributor).toMatchObject(fillerContributor)
    expect(next).toHaveBeenCalledWith()
  })
})

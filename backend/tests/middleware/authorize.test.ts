import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import {
  allOf,
  anyOf,
  assigneeNullToSelf,
  isAssignee,
  isCommentCreator,
  isInvitee,
  isIssueCreator,
  isProjectCreator,
  isProjectMember,
  isSender,
  removingAssignee,
  requireRule,
} from '../../src/api/middleware/authorize'
import { Request, Response } from 'express'
import { AppError } from '../../src/api/errors/AppError'

describe('requireRule / authorize.ts', () => {
  let req: Request
  let res: Response
  let next: Mock
  let mockRule: Mock

  beforeEach(() => {
    req = {} as Request
    res = {} as Response
    next = vi.fn()
    mockRule = vi.fn()
  })

  it('When rule check is true/followed, calls next()', async () => {
    mockRule.mockReturnValue(true)

    const middleware = requireRule(mockRule)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('When rule check is false/broken, calls next with UNAUTHORIZED_REQUEST AppError', async () => {
    mockRule.mockReturnValue(false)

    const middleware = requireRule(mockRule)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(new AppError('UNAUTHORIZED_REQUEST'))
  })

  it('When rule check fails, catches error and calls next with it', async () => {
    mockRule.mockImplementation(() => {
      throw new Error('ya done messed up')
    })

    const middleware = requireRule(mockRule)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(new Error('ya done messed up'))
  })
})

describe('anyOf / allOf', () => {
  let req: Request
  let res: Response
  let mockRuleTrue: Mock
  let mockRuleFalse: Mock
  let mockRuleFiller: Mock

  beforeEach(() => {
    vi.resetAllMocks()

    req = {} as Request
    res = {} as Response
    mockRuleTrue = vi.fn().mockReturnValue(true)
    mockRuleFalse = vi.fn().mockReturnValue(false)
    mockRuleFiller = vi.fn()
  })

  it('anyOf returns true when one case passes, not returning until then', () => {
    const middleware = anyOf(mockRuleFalse, mockRuleTrue, mockRuleFiller)

    const result = middleware(req, res)

    expect(result).toBe(true)
    expect(mockRuleFalse).toHaveBeenCalledOnce()
    expect(mockRuleTrue).toHaveBeenCalledOnce()
    expect(mockRuleFiller).not.toHaveBeenCalled()
  })

  it('anyOf returns false when no case passes, running each', () => {
    mockRuleFiller.mockReturnValueOnce(false)
    const middleware = anyOf(mockRuleFalse, mockRuleFiller)

    const result = middleware(req, res)

    expect(result).toBe(false)
    expect(mockRuleFalse).toHaveBeenCalledOnce()
    expect(mockRuleFiller).toHaveBeenCalledOnce()
  })

  it('allOf returns true when all cases pass, running each', () => {
    mockRuleFiller.mockReturnValueOnce(true)
    const middleware = allOf(mockRuleFiller, mockRuleTrue)

    const result = middleware(req, res)

    expect(result).toBe(true)
    expect(mockRuleFiller).toHaveBeenCalledOnce()
    expect(mockRuleTrue).toHaveBeenCalledOnce()
  })

  it('allOf returns false when any case fails, not returning until then', () => {
    const middleware = allOf(mockRuleTrue, mockRuleFalse, mockRuleFiller)

    const result = middleware(req, res)

    expect(result).toBe(false)
    expect(mockRuleTrue).toHaveBeenCalledOnce()
    expect(mockRuleFalse).toHaveBeenCalledOnce()
    expect(mockRuleFiller).not.toHaveBeenCalled()
  })
})

describe('individual Rule checks', () => {
  let req: Request
  let res: Response
  const userId = 'id'

  beforeEach(() => {
    req = {
      user: { sub: userId },
    } as unknown as Request
    res = { locals: {} } as Response
  })

  it.each([
    {
      ruleName: 'isProjectCreator',
      rule: isProjectCreator,
      resourceType: 'project',
      field: 'creator_id',
    },
    {
      ruleName: 'isIssueCreator',
      rule: isIssueCreator,
      resourceType: 'issue',
      field: 'creator_id',
    },
    {
      ruleName: 'isCommentCreator',
      rule: isCommentCreator,
      resourceType: 'comment',
      field: 'creator_id',
    },
    {
      ruleName: 'isAssignee',
      rule: isAssignee,
      resourceType: 'issue',
      field: 'assignee_id',
    },
    {
      ruleName: 'isSender',
      rule: isSender,
      resourceType: 'invite',
      field: 'sender_id',
    },
    {
      ruleName: 'isInvitee',
      rule: isInvitee,
      resourceType: 'invite',
      field: 'recipient_id',
    },
  ])(
    '$ruleName returns true when given field matches user.sub, false otherwise',
    ({ rule, resourceType, field }) => {
      res.locals[resourceType] = { [field]: userId }
      expect(rule(req, res)).toBe(true)

      res.locals[resourceType] = { [field]: 'otherId' }
      expect(rule(req, res)).toBe(false)
    },
  )

  it('isProjectMember returns true when user id matches res.locals.project.creator_id', () => {
    res.locals.project = { creator_id: userId }
    expect(isProjectMember(req, res)).toBe(true)
  })

  it('isProjectMember returns true when res.locals.contributor was found and loaded onto res.locals', () => {
    res.locals.project = { creator_id: 'some1 else' }
    res.locals.contributor = { user_id: userId }
    expect(isProjectMember(req, res)).toBe(true)
  })

  it('isProjectMember returns false when user is not project creator and no contributor row was found/loaded into res.locals', () => {
    res.locals.project = { creator_id: 'some2 else' }
    expect(isProjectMember(req, res)).toBe(false)
  })

  it('assigneeNullToSelf returns true when issue is unassigned and validated assignee_id is the requesting user', () => {
    res.locals.issue = { assignee_id: null }
    res.locals.validated = { assignee_id: userId }
    expect(assigneeNullToSelf(req, res)).toBe(true)
  })

  it('assigneeNullToSelf returns false when issue is unassigned but validated assignee_id is someone else', () => {
    res.locals.issue = { assignee_id: null }
    res.locals.validated = { assignee_id: 'otherId' }
    expect(assigneeNullToSelf(req, res)).toBe(false)
  })

  it('assigneeNullToSelf returns false when issue already has an assignee, even if validated assignee_id is the requesting user', () => {
    res.locals.issue = { assignee_id: 'someoneElse' }
    res.locals.validated = { assignee_id: userId }
    expect(assigneeNullToSelf(req, res)).toBe(false)
  })

  it('removingAssignee returns true when validated assignee_id is null', () => {
    res.locals.validated = { assignee_id: null }
    expect(removingAssignee(req, res)).toBe(true)
  })

  it('removingAssignee returns false when validated assignee_id is a user id', () => {
    res.locals.validated = { assignee_id: userId }
    expect(removingAssignee(req, res)).toBe(false)
  })
})

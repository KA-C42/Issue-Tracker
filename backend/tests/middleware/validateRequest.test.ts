import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { validateRequest } from '../../src/api/middleware/validateRequest'
import { createProjectSchema } from '@issue-tracker/shared'
import { Request, Response } from 'express'
import { AppError } from '../../src/api/errors/AppError'

describe('validateRequest', () => {
  let req: Request
  let res: Response
  let next: Mock

  beforeEach(() => {
    req = {
      body: {
        title: 'Reasonable name',
        code: 'FOUR',
        description: 'descriptive description for describing dis script',
      },
      params: {},
    } as Request
    res = {
      locals: {},
    } as Response
    next = vi.fn()
  })

  it('successfully validates, loading the result into res.locals.validated and calling next()', async () => {
    const middleware = validateRequest(createProjectSchema, (req) => ({
      title: req.body.title,
      code: req.body.code,
      description: req.body.description,
    }))

    await middleware(req, res, next)

    expect(res.locals.validated).toMatchObject(req.body)
    expect(next).toHaveBeenCalledWith()
  })

  it('throws a VALIDATION_ERROR AppError with the validation details, without calling next() or touching res.locals, when the selector output does not match the schema', async () => {
    req.body.title = 42

    const middleware = validateRequest(createProjectSchema, (req) => ({
      creator_id: req.body.creator_id,
      title: req.body.title,
      code: req.body.code,
      description: req.body.description,
    }))

    await middleware(req, res, next)

    const error = next.mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: [
        {
          expected: 'string',
          code: 'invalid_type',
          path: ['title'],
        },
      ],
    })
  })

  it('includes every failing field in the error details, not just the first one', async () => {
    req.body.title = 42
    req.body.code = 'Three' // code requires 4 alphanumeric characters

    const middleware = validateRequest(createProjectSchema, (req) => ({
      creator_id: req.body.creator_id,
      title: req.body.title,
      code: req.body.code,
      description: req.body.description,
    }))

    await middleware(req, res, next)

    expect(res.locals).toMatchObject({})

    const error = next.mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: [
        {
          expected: 'string',
          code: 'invalid_type',
          path: ['title'],
        },
        {
          code: 'too_big',
          path: ['code'],
        },
      ],
    })
  })

  it('validates a selector that combines fields from more than one request source (e.g. params and body together)', async () => {
    req.params.title = 'paramTitle'

    const middleware = validateRequest(createProjectSchema, (req) => ({
      title: req.params.title as string,
      code: req.body.code,
      description: req.body.description,
    }))

    await middleware(req, res, next)

    expect(res.locals.validated).toMatchObject({
      ...req.body,
      title: req.params.title,
    })
    expect(next).toHaveBeenCalledWith()
  })
})

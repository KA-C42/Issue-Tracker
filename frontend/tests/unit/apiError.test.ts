import { describe, it, expect, vi } from 'vitest'
import {
  ApiError,
  apiErrorToFormDisplay,
  getErrorMessage,
} from '@/api/apiError'
import type { ApiErrorBody } from '@/api/apiError'

describe('apiErrorToFormDisplay', () => {
  it('sets the error on the field and returns true when a field is present', () => {
    const err: ApiErrorBody = {
      code: 'DUPLICATE_NAME',
      message: 'A project with this name already exists',
      field: 'name',
    }
    const setError = vi.fn()

    const result = apiErrorToFormDisplay(err, setError)

    expect(result).toBe(true)
    expect(setError).toHaveBeenCalledWith('name', {
      message: 'A project with this name already exists',
    })
  })

  it('returns false and sets nothing when no field is present', () => {
    const err: ApiErrorBody = {
      code: 'SERVER_ERROR',
      message: 'Something went wrong',
    }
    const setError = vi.fn()

    const result = apiErrorToFormDisplay(err, setError)

    expect(result).toBe(false)
    expect(setError).not.toHaveBeenCalled()
  })
})

describe('getErrorMessage', () => {
  it.each([
    [
      'a permission error',
      new ApiError(403, { code: 'UNAUTHORIZED_REQUEST', message: 'raw' }),
      "You don't have permission to do that.",
    ],
    [
      'an expired session',
      new ApiError(401, { code: 'INVALID_TOKEN', message: 'raw' }),
      'Something went wrong.',
    ],
    [
      'any other server error',
      new ApiError(500, { code: 'UNKNOWN_ERROR', message: 'raw' }),
      'Something went wrong.',
    ],
    [
      'a network failure',
      new TypeError('Failed to fetch'),
      'Something went wrong.',
    ],
  ])('handles %s', (_, err, expected) => {
    expect(getErrorMessage(err)).toBe(expected)
  })
})

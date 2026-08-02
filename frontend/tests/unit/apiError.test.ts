import { describe, it, expect, vi } from 'vitest'
import { apiErrorToFormDisplay } from '@/api/apiError'
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

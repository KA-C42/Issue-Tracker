import type { Response } from 'supertest'
import { expect } from 'vitest'

export default function expectValidationError(
  result: Response,
  expectedProblem: { code: string; path: string[] },
) {
  expect(result.body.error.code).toBe('VALIDATION_ERROR')
  expect(result.body.error.details[0]).toMatchObject(expectedProblem)
}

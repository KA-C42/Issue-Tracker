import type {
  ErrorOption,
  FieldValues,
  Path,
  UseFormSetError,
} from 'react-hook-form'

export interface ApiErrorBody {
  code: string
  message: string
  field?: string
}

export class ApiError extends Error {
  status: number
  error: ApiErrorBody

  constructor(status: number, error: ApiErrorBody) {
    super(error?.message ?? `API error ${status}`)
    // this.name = 'ApiError'
    this.status = status
    this.error = error
  }
}

// if field-specific, let RHF display with the field
export function apiErrorToFormDisplay<T extends FieldValues>(
  err: ApiErrorBody,
  setError: UseFormSetError<T>,
) {
  if (!err.field) return false

  setError(err.field as Path<T>, err.message as ErrorOption)

  return true
}

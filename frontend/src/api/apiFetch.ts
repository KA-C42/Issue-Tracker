import { supabase } from '@/auth/supabaseClient'
import type { bodyTypes } from './bodyTypes'
import { ApiError, type ApiErrorBody } from './apiError'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const UNKNOWN_ERROR: ApiErrorBody = {
  code: 'UNKNOWN_ERROR',
  message: 'Something went wrong. Please try again.',
}

async function apiFetch(
  method: HttpMethod,
  path: string,
  options?: {
    signal?: AbortSignal
    body?: bodyTypes
  },
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(path, {
    method: method,
    signal: options?.signal,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-json body handled by default UNKNOWN_ERROR below
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? UNKNOWN_ERROR)
  }
  return data
}

export { apiFetch }

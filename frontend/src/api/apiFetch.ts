import { supabase } from '@/auth/supabaseClient'
import type { bodyTypes } from './bodyTypes'
import { ApiError, type ApiErrorBody } from './apiError'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

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
    body: options ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.error as ApiErrorBody)
  }
  return data
}

export { apiFetch }

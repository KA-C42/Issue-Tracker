import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: ({ signal }) => getProfile(signal),
})

export const profileByIdQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId],
    queryFn: ({ signal }) => getProfileById(signal, userId),
  })

async function getProfileById(abortSignal: AbortSignal, userId: string) {
  return apiFetch('GET', `/api/profiles/${userId}`, { signal: abortSignal })
}

async function getProfile(abortSignal: AbortSignal) {
  const result = await apiFetch('GET', '/api/me/profile', {
    signal: abortSignal,
  })
  return result
}

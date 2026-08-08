import { queryOptions } from '@tanstack/react-query'
import { apiFetch } from './apiFetch'

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: ({ signal }) => getProfile(signal),
})

async function getProfile(abortSignal: AbortSignal) {
  const result = await apiFetch('GET', '/api/profiles/me', {
    signal: abortSignal,
  })
  return result
}

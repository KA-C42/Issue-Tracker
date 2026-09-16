import { useQuery } from '@tanstack/react-query'
import { profileByIdQueryOptions } from '@/api/profiles'
import { Skeleton } from './ui/skeleton'

export function Username({ userId }: { userId: string }) {
  const query = useQuery(profileByIdQueryOptions(userId))

  if (query.isLoading)
    return <Skeleton className="inline-block h-4 w-16 align-middle" />
  if (query.isError || !query.data)
    return <span className="text-muted-foreground">unknown user</span>

  return <span>{query.data.username}</span>
}

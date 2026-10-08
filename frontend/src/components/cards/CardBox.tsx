// components/cards/CardBox.tsx
import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '../ui/skeleton'

export default function CardBox<T>({
  title,
  data,
  isError = false,
  renderCard,
}: {
  title: string
  isError?: boolean
  data: T[] | undefined
  renderCard: (item: T, index: number) => ReactNode
}) {
  let content: ReactNode

  if (data)
    content =
      data.length === 0 ? (
        <p className="flex justify-center">Nothing here yet.</p>
      ) : (
        data.map((item, index) => renderCard(item, index))
      )
  else if (isError)
    content = <p className="flex justify-center">Couldn't load content</p>
  else
    content = (
      <div role="status" aria-label="Loading" className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  return (
    <Card className="flex sm:h-full flex-col">
      <CardHeader>
        <CardTitle className="text-center font-semibold">{title}</CardTitle>
      </CardHeader>
      {/* *:shrink-0: cards overflow and scroll instead of squishing */}
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-1 *:shrink-0">
        {content}
      </CardContent>
    </Card>
  )
}

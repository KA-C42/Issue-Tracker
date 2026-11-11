// components/cards/CardBox.tsx
import { isValidElement, useId, type ReactNode } from 'react'
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
  const titleId = useId()
  let content: ReactNode

  if (data)
    content =
      data.length === 0 ? (
        <p className="flex justify-center">Nothing here yet.</p>
      ) : (
        // role="list" because Safari drops list semantics once Tailwind
        // removes the bullets
        <ul role="list" className="flex flex-col gap-3">
          {data.map((item, index) => {
            const card = renderCard(item, index)
            // callers key their cards, so the key moves up to the <li>
            const key = isValidElement(card) ? card.key : null
            return <li key={key ?? index}>{card}</li>
          })}
        </ul>
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
    <Card
      role="region"
      aria-labelledby={titleId}
      className="flex max-h-[60svh] flex-col md:h-full md:max-h-none"
    >
      <CardHeader>
        <CardTitle id={titleId} className="text-center font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      {/* *:shrink-0: cards overflow and scroll instead of squishing */}
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-1 *:shrink-0">
        {content}
      </CardContent>
    </Card>
  )
}

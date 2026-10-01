// components/cards/CardBox.tsx
import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function CardBox<T>({
  title,
  data,
  renderCard,
}: {
  title: string
  data: T[]
  renderCard: (item: T, index: number) => ReactNode
}) {
  return (
    <Card className="flex sm:h-full flex-col">
      <CardHeader>
        <CardTitle className="text-center font-semibold">{title}</CardTitle>
      </CardHeader>
      {/* *:shrink-0: cards overflow and scroll instead of squishing */}
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-1 *:shrink-0">
        {data.length === 0 ? (
          <p className="flex justify-center">Nothing here yet.</p>
        ) : (
          data.map((item, index) => renderCard(item, index))
        )}
      </CardContent>
    </Card>
  )
}

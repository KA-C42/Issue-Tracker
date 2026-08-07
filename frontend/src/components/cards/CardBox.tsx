import type { ComponentType } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function CardBox<T extends { id: string }>({
  title,
  data,
  CardType,
}: {
  title: string
  data: T[]
  CardType: ComponentType<T>
}) {
  return (
    <Card className="flex h-100 flex-col">
      <CardHeader>
        <CardTitle className="text-center font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto p-1">
        {data.length === 0 ? (
          <p className="flex justify-center">Nothing here yet.</p>
        ) : (
          data.map((item) => (
            <div key={item.id}>
              <CardType {...item} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

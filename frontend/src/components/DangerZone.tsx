import type { ReactNode } from 'react'

interface DangerZoneProps {
  title: string
  description: string
  children: ReactNode // the action button
}

export function DangerZone({ title, description, children }: DangerZoneProps) {
  return (
    <section className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-destructive/50 p-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

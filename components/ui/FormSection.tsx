import { ReactNode } from 'react'

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-cream-200 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4">
        <h2 className="font-display text-lg font-medium text-forest-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-600">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

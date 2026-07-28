export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="h-px w-10 bg-cream-200" />
      <p className="text-sm text-ink-600">{message}</p>
    </div>
  )
}

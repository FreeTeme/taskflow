interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`motion-safe:animate-pulse rounded-lg bg-border/60 ${className}`}
      aria-hidden="true"
    />
  )
}

export function BoardListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="w-72 shrink-0 rounded-xl border border-border bg-surface p-4"
        >
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

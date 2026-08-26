import { MagnifyingGlass } from '@phosphor-icons/react'

interface TaskSearchProps {
  value: string
  onChange: (value: string) => void
}

export function TaskSearch({ value, onChange }: TaskSearchProps) {
  return (
    <label className="relative block">
      <span className="sr-only">Search tasks</span>
      <MagnifyingGlass
        aria-hidden="true"
        size={18}
        className="pointer-events-none absolute inset-y-0 left-3 my-auto text-text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks..."
        className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-base text-text shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:text-sm"
      />
    </label>
  )
}

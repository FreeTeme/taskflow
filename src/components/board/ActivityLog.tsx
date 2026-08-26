import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import type { ActivityEvent } from '../../hooks/useRealtimeBoard'

interface ActivityLogProps {
  events: ActivityEvent[]
  onClear?: () => void
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function ActivityLog({ events, onClear }: ActivityLogProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4">
        <div>
          <h3 className="text-sm font-semibold text-text">Activity</h3>
          <p className="mt-0.5 text-xs text-text-muted">Latest realtime updates</p>
        </div>
        <div className="flex items-center gap-2">
        {events.length > 0 && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="hidden min-h-10 rounded-lg px-3 text-xs font-medium text-text-muted transition-[background-color,color,transform] hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96] sm:inline-flex sm:items-center"
          >
            Clear
          </button>
        ) : null}
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse activity' : 'Expand activity'}
            className="grid size-10 place-items-center rounded-lg text-text-muted transition-[background-color,color,transform] hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96]"
          >
            <CaretDown aria-hidden="true" size={18} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border px-4 py-3">
          {events.length === 0 ? (
            <p className="py-2 text-sm text-text-muted">Realtime updates will appear here.</p>
          ) : (
            <ul className="max-h-52 divide-y divide-border overflow-y-auto">
              {events.map((event) => (
                <li key={event.id} className="flex gap-4 py-3 text-sm text-text">
                  <span className="w-20 shrink-0 tabular-nums text-text-muted">{formatTime(event.timestamp)}</span>
                  <span className="min-w-0 break-words">{event.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

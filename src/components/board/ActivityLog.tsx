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
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Activity</h3>
        {events.length > 0 && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-text-muted transition-colors hover:text-text"
          >
            Clear
          </button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-text-muted">Realtime updates will appear here.</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {events.map((event) => (
            <li key={event.id} className="text-sm text-text">
              <span className="text-text-muted">{formatTime(event.timestamp)}</span>{' '}
              {event.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { Bell, Check, FolderOpen } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

export function NotificationMenu() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex size-10 items-center justify-center rounded-lg text-text-muted transition-[background-color,color,transform] hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96]"
      >
        <Bell aria-hidden="true" size={21} weight={unreadCount > 0 ? 'fill' : 'regular'} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-danger-fill px-1 text-center text-[10px] font-semibold leading-4 text-danger-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          id={panelId}
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4">
            <h2 className="text-sm font-semibold text-text">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={isMarkingAllRead}
                onClick={() => void markAllRead()}
                className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-text-muted">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Check aria-hidden="true" size={24} className="mx-auto mb-2 text-success" />
              <p className="text-sm font-medium text-text">You’re all caught up</p>
              <p className="mt-1 text-xs text-text-muted">Board invitations will appear here.</p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {notifications.map((notification) => {
                const actorName = notification.actor?.name ?? 'A teammate'
                const boardTitle = notification.board?.title ?? 'a board'
                return (
                  <li key={notification.id}>
                    <Link
                      to={`/boards/${notification.board_id}`}
                      onClick={() => {
                        setOpen(false)
                        if (!notification.read_at) void markRead(notification.id)
                      }}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${notification.read_at ? '' : 'bg-primary/5'}`}
                    >
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FolderOpen aria-hidden="true" size={18} weight="fill" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-text">
                          <strong className="font-semibold">{actorName}</strong> invited you to{' '}
                          <strong className="font-semibold">{boardTitle}</strong>
                        </span>
                        <span className="mt-1 block text-xs text-text-muted">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </span>
                      {!notification.read_at ? (
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary">
                          <span className="sr-only">Unread</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}

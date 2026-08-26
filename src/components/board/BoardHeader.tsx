import { Link } from 'react-router-dom'
import { CaretRight, CheckCircle } from '@phosphor-icons/react'
import type { Board } from '../../types/database'
import { NotificationMenu } from '../shared/NotificationMenu'

interface BoardHeaderProps {
  board: Board
}

export function BoardHeader({ board }: BoardHeaderProps) {
  return (
    <header className="border-b border-border bg-surface px-4 sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex min-h-16 items-center gap-3">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg text-base font-semibold tracking-[-0.02em] text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CheckCircle aria-hidden="true" size={19} weight="bold" />
            </span>
            <span>TaskFlow</span>
          </Link>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
            <Link
              to="/"
              className="shrink-0 rounded text-sm font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Boards
            </Link>
            <CaretRight aria-hidden="true" size={14} className="shrink-0 text-text-muted" />
            <span className="truncate text-sm text-text-muted">{board.title}</span>
          </nav>
          <div className="ml-auto">
            <NotificationMenu />
          </div>
        </div>
        <div className="pb-6 pt-2">
          <h1 className="text-2xl font-semibold leading-[1.1] tracking-[-0.025em] text-text sm:text-[1.75rem]">
            {board.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            Keep priorities visible and move work forward together.
          </p>
        </div>
      </div>
    </header>
  )
}

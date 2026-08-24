import { Link } from 'react-router-dom'
import type { Board } from '../../types/database'

interface BoardHeaderProps {
  board: Board
}

export function BoardHeader({ board }: BoardHeaderProps) {
  return (
    <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            className="shrink-0 text-sm font-medium text-text-muted transition hover:text-text"
          >
            ← Boards
          </Link>
          <h1 className="truncate text-xl font-semibold text-text">
            {board.title}
          </h1>
        </div>
      </div>
    </header>
  )
}

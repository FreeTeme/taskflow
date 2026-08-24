import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BoardListSkeleton } from '../components/ui/Skeleton'
import { Toast } from '../components/ui/Toast'
import { ThemeToggle } from '../providers/ThemeProvider'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function BoardsPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const {
    boards,
    isLoading,
    isError,
    error,
    createBoard,
    isCreating,
    deleteBoard,
  } = useBoards()

  const [title, setTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    try {
      const board = await createBoard(trimmed)
      setTitle('')
      setShowCreate(false)
      navigate(`/boards/${board.id}`)
    } catch (createError) {
      setToastMessage(getErrorMessage(createError))
    }
  }

  const handleDelete = async (boardId: string, boardTitle: string) => {
    const confirmed = window.confirm(`Delete "${boardTitle}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteBoard(boardId)
    } catch (deleteError) {
      setToastMessage(getErrorMessage(deleteError))
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (signOutError) {
      setToastMessage(getErrorMessage(signOutError))
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">TaskFlow</h1>
            <p className="text-sm text-text-muted">Your kanban boards</p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link
              to="/profile"
              className="font-medium text-text-muted transition hover:text-text"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="font-medium text-text-muted transition hover:text-text"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text">Boards</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            New board
          </button>
        </div>

        {isLoading && <BoardListSkeleton />}

        {isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {getErrorMessage(error)}
          </div>
        )}

        {!isLoading && !isError && boards.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="mb-4 text-text-muted">No boards yet. Create your first one.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              Create board
            </button>
          </div>
        )}

        {!isLoading && boards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <article
                key={board.id}
                className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <Link to={`/boards/${board.id}`} className="block">
                  <h3 className="mb-2 text-lg font-semibold text-text group-hover:text-primary">
                    {board.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(board.id, board.title)}
                  className="mt-4 text-xs font-medium text-text-muted transition hover:text-danger"
                >
                  Delete board
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-board-title"
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 id="create-board-title" className="mb-4 text-lg font-semibold text-text">
              Create board
            </h2>
            <form onSubmit={(event) => void handleCreate(event)}>
              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-medium text-text">Title</span>
                <input
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="My project board"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    setTitle('')
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  )
}

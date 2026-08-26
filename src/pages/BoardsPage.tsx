import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BoardListSkeleton } from '../components/ui/Skeleton'
import { Toast } from '../components/ui/Toast'
import { ThemeToggle } from '../providers/ThemeProvider'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { ConfirmDialog, Modal } from '../components/shared/Modal'
import { NotificationMenu } from '../components/shared/NotificationMenu'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function BoardsPage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const {
    boards,
    isLoading,
    isError,
    error,
    createBoard,
    isCreating,
    deleteBoard,
    isDeleting,
  } = useBoards()

  const [title, setTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [boardToDelete, setBoardToDelete] = useState<{ id: string; title: string } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Enter a board title.')
      titleInputRef.current?.focus()
      return
    }

    try {
      const board = await createBoard(trimmed)
      setTitle('')
      setTitleError('')
      setShowCreate(false)
      navigate(`/boards/${board.id}`)
    } catch (createError) {
      setToastMessage(getErrorMessage(createError))
    }
  }

  const handleDelete = async () => {
    if (!boardToDelete) return
    try {
      await deleteBoard(boardToDelete.id)
      setBoardToDelete(null)
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
      <a href="#main-content" className="skip-link">Skip to boards</a>
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div>
            <h1 className="text-2xl font-bold text-text">TaskFlow</h1>
            <p className="text-sm text-text-muted">Your kanban boards</p>
          </div>
          <nav aria-label="Account" className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
            <NotificationMenu />
            <ThemeToggle />
            <Link
              to="/profile"
              className="inline-flex min-h-10 items-center rounded-md px-2 font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex min-h-10 items-center rounded-md px-2 font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text">Boards</h2>
          <Button onClick={() => setShowCreate(true)}>Create board</Button>
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
            <Button onClick={() => setShowCreate(true)}>Create board</Button>
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
                  <p className="text-xs tabular-nums text-text-muted">
                    Created {new Date(board.created_at).toLocaleDateString()}
                  </p>
                </Link>
                {board.owner_id === user?.id ? (
                  <Button variant="ghost" size="sm" onClick={() => setBoardToDelete({ id: board.id, title: board.title })} className="mt-3 text-danger hover:text-danger">
                    Delete board
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setTitle(''); setTitleError('') }} title="Create board" initialFocusRef={titleInputRef} footer={
        <>
          <Button variant="secondary" onClick={() => { setShowCreate(false); setTitle(''); setTitleError('') }} disabled={isCreating}>Cancel</Button>
          <Button type="submit" form="create-board-form" loading={isCreating}>Create board</Button>
        </>
      }>
        <form id="create-board-form" onSubmit={(event) => void handleCreate(event)}>
          <Input ref={titleInputRef} label="Title" name="title" value={title} onChange={(event) => { setTitle(event.target.value); if (titleError) setTitleError('') }} placeholder="Product launch" error={titleError} required />
        </form>
      </Modal>

      <ConfirmDialog
        open={boardToDelete !== null}
        title="Delete board?"
        description={`“${boardToDelete?.title ?? ''}” and all of its columns and tasks will be permanently deleted.`}
        confirmLabel="Delete board"
        destructive
        loading={isDeleting}
        onClose={() => setBoardToDelete(null)}
        onConfirm={() => void handleDelete()}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  )
}

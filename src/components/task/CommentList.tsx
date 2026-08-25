import { Button } from '../shared/Button'
import { Spinner } from '../shared/Spinner'
import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../providers/AuthProvider'
import { useToast } from '../../providers/ToastProvider'
import { Avatar } from '../shared/Avatar'

interface CommentListProps {
  taskId: string
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function CommentList({ taskId }: CommentListProps) {
  const { user } = useAuth()
  const toast = useToast()
  const {
    comments,
    isLoading,
    isError,
    deleteComment,
    isDeleting,
    refetch,
  } = useComments(taskId)

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId)
    } catch {
      toast.error('Unable to delete comment. Try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-danger/30 p-3">
        <p className="text-sm text-text">Unable to load comments.</p>
        <Button variant="ghost" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (comments.length === 0) {
    return <p className="text-sm text-text-muted">No comments yet.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => {
        const isOwn = user?.id === comment.user_id

        return (
          <li
            key={comment.id}
            className="rounded-lg border border-border bg-surface-muted px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  name={comment.author?.name}
                  src={comment.author?.avatar_url}
                  size="sm"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text">
                    {comment.author?.name ?? 'Unknown user'}
                  </p>
                  <time
                    dateTime={comment.created_at}
                    className="block text-xs text-text-muted"
                  >
                    {formatTime(comment.created_at)}
                  </time>
                </div>
              </div>
              {isOwn ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => void handleDelete(comment.id)}
                  aria-label="Delete comment"
                >
                  Delete
                </Button>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text">{comment.content}</p>
          </li>
        )
      })}
    </ul>
  )
}

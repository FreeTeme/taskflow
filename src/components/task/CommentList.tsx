import { Button } from '../shared/Button'
import { Spinner } from '../shared/Spinner'
import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../providers/AuthProvider'

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
  const { comments, isLoading, deleteComment, isDeleting } = useComments(taskId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
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
              <div>
                <p className="text-sm font-medium text-text">
                  {comment.author?.name ?? 'Unknown user'}
                </p>
                <p className="text-xs text-text-muted">{formatTime(comment.created_at)}</p>
              </div>
              {isOwn ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => void deleteComment(comment.id)}
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

import { useState, type FormEvent } from 'react'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { useComments } from '../../hooks/useComments'
import { useAuth } from '../../providers/AuthProvider'

interface CommentFormProps {
  taskId: string
}

export function CommentForm({ taskId }: CommentFormProps) {
  const { user } = useAuth()
  const { addComment, isAdding } = useComments(taskId)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (!content.trim()) {
      setError('Write a comment before posting.')
      return
    }

    setError(null)
    try {
      await addComment({ userId: user.id, content })
      setContent('')
    } catch {
      setError('Unable to post comment. Check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        label="Add comment"
        value={content}
        onChange={(event) => {
          setContent(event.target.value)
          if (event.target.value.trim()) setError(null)
        }}
        placeholder="Write a comment..."
        disabled={!user || isAdding}
        aria-invalid={!!error}
        aria-describedby={error ? 'comment-error' : undefined}
      />
      {error ? (
        <p id="comment-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isAdding} disabled={!user}>
          Post comment
        </Button>
      </div>
    </form>
  )
}

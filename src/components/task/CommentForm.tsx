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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !content.trim()) return

    await addComment({ userId: user.id, content })
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        label="Add comment"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        disabled={!user || isAdding}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isAdding} disabled={!content.trim() || !user}>
          Post
        </Button>
      </div>
    </form>
  )
}

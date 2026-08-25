import { supabase } from '../lib/supabase'
import type { Comment, CommentWithAuthor, Profile } from '../types/database'

async function attachAuthors(comments: Comment[]): Promise<CommentWithAuthor[]> {
  if (comments.length === 0) return []

  const userIds = [...new Set(comments.map((comment) => comment.user_id))]
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) throw error

  const profileMap = new Map<string, Profile>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return comments.map((comment) => ({
    ...comment,
    author: profileMap.get(comment.user_id) ?? null,
  }))
}

export async function fetchComments(taskId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return attachAuthors(data ?? [])
}

export async function addComment(
  taskId: string,
  userId: string,
  content: string,
): Promise<CommentWithAuthor> {
  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error('Comment cannot be empty')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content: trimmed })
    .select('*')
    .single()

  if (error) throw error

  const [withAuthor] = await attachAuthors([data])
  return withAuthor!
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Comment was not deleted')
}

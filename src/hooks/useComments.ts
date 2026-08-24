import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addComment, deleteComment, fetchComments } from '../services/comments'

export const commentsQueryKey = (taskId: string) => ['comments', taskId] as const

export function useComments(taskId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: commentsQueryKey(taskId ?? ''),
    queryFn: () => fetchComments(taskId!),
    enabled: Boolean(taskId),
  })

  const addMutation = useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      addComment(taskId!, userId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId!) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId!) })
    },
  })

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addComment: addMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

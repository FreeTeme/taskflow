import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  createBoard,
  deleteBoard,
  fetchBoards,
} from '../services/boards'
import { useAuth } from './useAuth'

export function useBoards() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const boardsQuery = useQuery({
    queryKey: queryKeys.boards.all,
    queryFn: fetchBoards,
    enabled: !!user,
  })

  const createBoardMutation = useMutation({
    mutationFn: (title: string) => {
      if (!user) throw new Error('You must be signed in to create a board')
      return createBoard(title, user.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all })
    },
  })

  return {
    boards: boardsQuery.data ?? [],
    isLoading: boardsQuery.isLoading,
    isError: boardsQuery.isError,
    error: boardsQuery.error,
    createBoard: createBoardMutation.mutateAsync,
    isCreating: createBoardMutation.isPending,
    deleteBoard: deleteBoardMutation.mutateAsync,
    isDeleting: deleteBoardMutation.isPending,
  }
}

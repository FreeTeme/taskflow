import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  createColumn,
  deleteColumn,
  fetchColumns,
  reorderColumns,
  updateColumn,
} from '../services/columns'
import { useAuth } from './useAuth'

export function useColumns(boardId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const columnsQuery = useQuery({
    queryKey: boardId ? queryKeys.columns.byBoard(boardId) : ['columns', 'missing'],
    queryFn: () => {
      if (!boardId) throw new Error('Board id is required')
      return fetchColumns(boardId)
    },
    enabled: !!user && !!boardId,
  })

  const invalidate = () => {
    if (!boardId) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.columns.byBoard(boardId),
    })
  }

  const createColumnMutation = useMutation({
    mutationFn: ({ title, position }: { title: string; position: number }) => {
      if (!boardId) throw new Error('Board id is required')
      return createColumn(boardId, title, position)
    },
    onSuccess: invalidate,
  })

  const updateColumnMutation = useMutation({
    mutationFn: ({
      columnId,
      updates,
    }: {
      columnId: string
      updates: { title?: string; position?: number }
    }) => updateColumn(columnId, updates),
    onSuccess: invalidate,
  })

  const deleteColumnMutation = useMutation({
    mutationFn: deleteColumn,
    onSuccess: invalidate,
  })

  const reorderColumnsMutation = useMutation({
    mutationFn: reorderColumns,
    onSuccess: invalidate,
  })

  return {
    columns: columnsQuery.data ?? [],
    isLoading: columnsQuery.isLoading,
    isError: columnsQuery.isError,
    error: columnsQuery.error,
    createColumn: createColumnMutation.mutateAsync,
    updateColumn: updateColumnMutation.mutateAsync,
    deleteColumn: deleteColumnMutation.mutateAsync,
    reorderColumns: reorderColumnsMutation.mutateAsync,
  }
}

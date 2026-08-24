import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchBoard } from '../services/boards'
import { useAuth } from './useAuth'

export function useBoard(boardId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: boardId ? queryKeys.boards.detail(boardId) : ['boards', 'missing'],
    queryFn: () => {
      if (!boardId) throw new Error('Board id is required')
      return fetchBoard(boardId)
    },
    enabled: !!user && !!boardId,
  })
}

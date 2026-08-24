import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { commentsQueryKey } from './useComments'
import { membersQueryKey } from './useMembers'

export interface ActivityEvent {
  id: string
  message: string
  timestamp: Date
}

interface UseRealtimeBoardOptions {
  onActivity?: (event: ActivityEvent) => void
}

function createActivity(
  message: string,
  onActivity?: (event: ActivityEvent) => void,
): void {
  onActivity?.({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    timestamp: new Date(),
  })
}

export function useRealtimeBoard(
  boardId: string | undefined,
  options?: UseRealtimeBoardOptions,
) {
  const queryClient = useQueryClient()
  const onActivity = options?.onActivity

  useEffect(() => {
    if (!boardId) return

    const invalidateBoard = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byBoard(boardId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.columns.byBoard(boardId) })
      void queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId) })
    }

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          invalidateBoard()

          const record = (payload.new ?? payload.old) as { title?: string } | null
          const title = record?.title ?? 'task'

          if (payload.eventType === 'INSERT') {
            createActivity(`New task created: "${title}"`, onActivity)
          } else if (payload.eventType === 'UPDATE') {
            createActivity(`Task updated: "${title}"`, onActivity)
          } else if (payload.eventType === 'DELETE') {
            createActivity(`Task deleted: "${title}"`, onActivity)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          invalidateBoard()

          const record = (payload.new ?? payload.old) as { title?: string } | null
          const title = record?.title ?? 'column'

          if (payload.eventType === 'INSERT') {
            createActivity(`Column added: "${title}"`, onActivity)
          } else if (payload.eventType === 'UPDATE') {
            createActivity(`Column updated: "${title}"`, onActivity)
          } else if (payload.eventType === 'DELETE') {
            createActivity(`Column removed: "${title}"`, onActivity)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const record = payload.new as { task_id?: string } | null
          const oldRecord = payload.old as { task_id?: string } | null
          const taskId = record?.task_id ?? oldRecord?.task_id

          if (taskId) {
            void queryClient.invalidateQueries({ queryKey: commentsQueryKey(taskId) })
          }

          if (payload.eventType === 'INSERT') {
            createActivity('New comment added', onActivity)
          } else if (payload.eventType === 'DELETE') {
            createActivity('Comment deleted', onActivity)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId) })
          createActivity('Board membership changed', onActivity)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [boardId, queryClient, onActivity])
}

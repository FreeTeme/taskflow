import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../providers/AuthProvider'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id
  const notificationsKey = queryKeys.notifications.all(userId ?? 'anonymous')

  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: () => fetchNotifications(userId!),
    enabled: Boolean(userId),
  })

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.all(userId),
          })
          void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all(userId) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  })

  const notifications = query.data ?? []

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read_at).length,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingAllRead: markAllReadMutation.isPending,
  }
}

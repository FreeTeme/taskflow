import { supabase } from '../lib/supabase'
import type { Notification, NotificationWithDetails, Profile, Board } from '../types/database'

export async function fetchNotifications(userId: string): Promise<NotificationWithDetails[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  const notifications = (data ?? []) as Notification[]
  if (notifications.length === 0) return []

  const boardIds = [...new Set(notifications.map((notification) => notification.board_id))]
  const actorIds = [...new Set(notifications.map((notification) => notification.actor_id))]

  const [{ data: boards, error: boardsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase.from('boards').select('*').in('id', boardIds),
      supabase.from('profiles').select('*').in('id', actorIds),
    ])

  if (boardsError) throw boardsError
  if (profilesError) throw profilesError

  const boardsById = new Map<string, Board>(
    (boards ?? []).map((board) => [board.id, board]),
  )
  const profilesById = new Map<string, Profile>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return notifications.map((notification) => ({
    ...notification,
    board: boardsById.get(notification.board_id) ?? null,
    actor: profilesById.get(notification.actor_id) ?? null,
  }))
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
}

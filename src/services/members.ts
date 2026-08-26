import { supabase } from '../lib/supabase'
import type { BoardMemberWithProfile, Profile } from '../types/database'

async function attachProfiles(
  members: Array<{ id: string; board_id: string; user_id: string; role: 'owner' | 'member' }>,
): Promise<BoardMemberWithProfile[]> {
  if (members.length === 0) return []

  const userIds = [...new Set(members.map((member) => member.user_id))]
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) throw error

  const profileMap = new Map<string, Profile>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return members.map((member) => ({
    ...member,
    profile: profileMap.get(member.user_id) ?? null,
  }))
}

export async function fetchMembers(boardId: string): Promise<BoardMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId)
    .order('role', { ascending: true })

  if (error) throw error
  return attachProfiles(data ?? [])
}

export async function inviteMemberByEmail(
  boardId: string,
  email: string,
): Promise<{ status: 'added' | 'added_and_emailed' | 'already_member' | 'invited'; warning?: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required')
  }

  const { data, error } = await supabase.functions.invoke('invite-board-member', {
    body: { boardId, email: normalizedEmail },
  })

  if (error) {
    const context = error.context as Response | undefined
    if (context) {
      try {
        const body = await context.clone().json() as { error?: string }
        throw new Error(body.error ?? error.message)
      } catch (contextError) {
        if (contextError instanceof Error && contextError.message !== 'Unexpected end of JSON input') {
          throw contextError
        }
      }
    }
    throw error
  }

  return data as { status: 'added' | 'added_and_emailed' | 'already_member' | 'invited'; warning?: string }
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('board_members').delete().eq('id', memberId)
  if (error) throw error
}

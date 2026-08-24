import { supabase } from '../lib/supabase'
import type { Board } from '../types/database'

export async function fetchBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchBoard(boardId: string): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single()

  if (error) throw error
  return data
}

export async function createBoard(
  title: string,
  ownerId: string,
): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ title, owner_id: ownerId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId)

  if (error) throw error
}

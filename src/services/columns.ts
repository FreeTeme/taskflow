import { supabase } from '../lib/supabase'
import type { Column } from '../types/database'

export async function fetchColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createColumn(
  boardId: string,
  title: string,
  position: number,
): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateColumn(
  columnId: string,
  updates: Pick<Partial<Column>, 'title' | 'position'>,
): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .update(updates)
    .eq('id', columnId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteColumn(columnId: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', columnId)

  if (error) throw error
}

export async function reorderColumns(
  columns: Pick<Column, 'id' | 'position'>[],
): Promise<void> {
  const updates = columns.map(({ id, position }) =>
    supabase.from('columns').update({ position }).eq('id', id),
  )

  const results = await Promise.all(updates)
  const error = results.find((result) => result.error)?.error
  if (error) throw error
}

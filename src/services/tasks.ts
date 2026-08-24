import { supabase } from '../lib/supabase'
import type { Task, TaskPriority } from '../types/database'

export type TaskUpdatePayload = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'due_date'
    | 'assignee_id'
    | 'column_id'
    | 'position'
  >
>

export type TaskMoveUpdate = Pick<Task, 'id' | 'column_id' | 'position'>

export interface CreateTaskParams {
  columnId: string
  title: string
  createdBy: string
  position: number
  priority?: TaskPriority
}

export async function fetchTasksByBoard(boardId: string): Promise<Task[]> {
  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .select('id')
    .eq('board_id', boardId)

  if (columnsError) throw columnsError
  if (!columns?.length) return []

  const columnIds = columns.map((column) => column.id)

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('column_id', columnIds)
    .order('position', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createTask({
  columnId,
  title,
  createdBy,
  position,
  priority = 'medium',
}: CreateTaskParams): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      column_id: columnId,
      title,
      created_by: createdBy,
      position,
      priority,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateTask(
  taskId: string,
  updates: TaskUpdatePayload,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function moveTask(updates: TaskMoveUpdate[]): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, column_id, position }) =>
      supabase.from('tasks').update({ column_id, position }).eq('id', id),
    ),
  )

  const error = results.find((result) => result.error)?.error
  if (error) throw error
}

import { supabase } from '../lib/supabase'
import type { Profile, Task, TaskPriority, TaskWithAssignee } from '../types/database'

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

async function attachAssignees(tasks: Task[]): Promise<TaskWithAssignee[]> {
  const assigneeIds = [
    ...new Set(
      tasks
        .map((task) => task.assignee_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (assigneeIds.length === 0) {
    return tasks.map((task) => ({ ...task, assignee: null }))
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', assigneeIds)

  if (error) throw error

  const profilesById = new Map<string, Profile>(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  )

  return tasks.map((task) => ({
    ...task,
    assignee: task.assignee_id
      ? profilesById.get(task.assignee_id) ?? null
      : null,
  }))
}

export async function fetchTasksByBoard(boardId: string): Promise<TaskWithAssignee[]> {
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
  return attachAssignees(data ?? [])
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
  if (updates.length === 0) return

  const { error } = await supabase.rpc('reorder_tasks', {
    p_updates: updates,
  })
  if (error) throw error
}

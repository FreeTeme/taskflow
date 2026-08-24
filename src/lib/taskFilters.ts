import type { Task, TaskPriority } from '../types/database'

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none'

export interface TaskFiltersState {
  priority: TaskPriority | 'all'
  assigneeId: string | 'all' | 'unassigned'
  dueDate: DueDateFilter
  search: string
}

export const defaultTaskFilters: TaskFiltersState = {
  priority: 'all',
  assigneeId: 'all',
  dueDate: 'all',
  search: '',
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfWeek(date: Date): Date {
  const copy = startOfDay(date)
  const day = copy.getDay()
  const diff = day === 0 ? 0 : 7 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function matchesDueDate(task: Task, filter: DueDateFilter, now = new Date()): boolean {
  if (filter === 'all') return true
  if (!task.due_date) return filter === 'none'

  const due = startOfDay(new Date(`${task.due_date}T00:00:00`))
  const today = startOfDay(now)

  switch (filter) {
    case 'none':
      return false
    case 'overdue':
      return due < today
    case 'today':
      return due.getTime() === today.getTime()
    case 'week':
      return due >= today && due <= endOfWeek(now)
    default:
      return true
  }
}

export function filterTasks(tasks: Task[], filters: TaskFiltersState): Task[] {
  const search = filters.search.trim().toLowerCase()

  return tasks.filter((task) => {
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false
    }

    if (filters.assigneeId === 'unassigned' && task.assignee_id) {
      return false
    }

    if (
      filters.assigneeId !== 'all' &&
      filters.assigneeId !== 'unassigned' &&
      task.assignee_id !== filters.assigneeId
    ) {
      return false
    }

    if (!matchesDueDate(task, filters.dueDate)) {
      return false
    }

    if (search && !task.title.toLowerCase().includes(search)) {
      return false
    }

    return true
  })
}

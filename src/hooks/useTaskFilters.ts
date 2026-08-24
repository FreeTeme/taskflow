import { useCallback, useMemo, useState } from 'react'
import {
  defaultTaskFilters,
  filterTasks,
  type TaskFiltersState,
} from '../lib/taskFilters'
import type { Task } from '../types/database'

export function useTaskFilters(initialTasks: Task[] = []) {
  const [filters, setFilters] = useState<TaskFiltersState>(defaultTaskFilters)

  const filteredTasks = useMemo(
    () => filterTasks(initialTasks, filters),
    [initialTasks, filters],
  )

  const setPriority = useCallback((priority: TaskFiltersState['priority']) => {
    setFilters((current) => ({ ...current, priority }))
  }, [])

  const setAssigneeId = useCallback((assigneeId: TaskFiltersState['assigneeId']) => {
    setFilters((current) => ({ ...current, assigneeId }))
  }, [])

  const setDueDate = useCallback((dueDate: TaskFiltersState['dueDate']) => {
    setFilters((current) => ({ ...current, dueDate }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((current) => ({ ...current, search }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultTaskFilters)
  }, [])

  return {
    filters,
    filteredTasks,
    setPriority,
    setAssigneeId,
    setDueDate,
    setSearch,
    resetFilters,
  }
}

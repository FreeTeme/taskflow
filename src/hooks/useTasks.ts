import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  createTask,
  deleteTask,
  fetchTasksByBoard,
  moveTask,
  type TaskMoveUpdate,
} from '../services/tasks'
import type { Task } from '../types/database'
import { useAuth } from './useAuth'

export function useTasks(boardId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const tasksQuery = useQuery({
    queryKey: boardId ? queryKeys.tasks.byBoard(boardId) : ['tasks', 'missing'],
    queryFn: () => {
      if (!boardId) throw new Error('Board id is required')
      return fetchTasksByBoard(boardId)
    },
    enabled: !!user && !!boardId,
  })

  const queryKey = boardId ? queryKeys.tasks.byBoard(boardId) : null

  const createTaskMutation = useMutation({
    mutationFn: ({
      columnId,
      title,
      position,
    }: {
      columnId: string
      title: string
      position: number
    }) => {
      if (!user) throw new Error('You must be signed in to create a task')
      return createTask({
        columnId,
        title,
        createdBy: user.id,
        position,
      })
    },
    onSuccess: () => {
      if (!queryKey) return
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      if (!queryKey) return
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  const moveTaskMutation = useMutation({
    mutationFn: moveTask,
    onMutate: async (updates: TaskMoveUpdate[]) => {
      if (!queryKey) return

      await queryClient.cancelQueries({ queryKey })
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (previousTasks) {
        const nextTasks = [...previousTasks]
        for (const update of updates) {
          const index = nextTasks.findIndex((task) => task.id === update.id)
          if (index === -1) continue
          const existing = nextTasks[index]
          if (!existing) continue
          nextTasks[index] = {
            ...existing,
            column_id: update.column_id,
            position: update.position,
          }
        }
        queryClient.setQueryData(queryKey, nextTasks)
      }

      return { previousTasks }
    },
    onError: (_error, _updates, context) => {
      if (!queryKey || !context?.previousTasks) return
      queryClient.setQueryData(queryKey, context.previousTasks)
    },
    onSettled: () => {
      if (!queryKey) return
      void queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    moveTask: moveTaskMutation.mutateAsync,
    isMoving: moveTaskMutation.isPending,
  }
}

export function groupTasksByColumn(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((groups, task) => {
    const columnTasks = groups[task.column_id] ?? []
    columnTasks.push(task)
    groups[task.column_id] = columnTasks
    return groups
  }, {})
}

export function buildMoveUpdates(
  tasksByColumn: Record<string, Task[]>,
  activeId: string,
  overColumnId: string,
  overIndex: number,
): TaskMoveUpdate[] {
  const activeTask = Object.values(tasksByColumn)
    .flat()
    .find((task) => task.id === activeId)

  if (!activeTask) return []

  const sourceColumnId = activeTask.column_id
  const nextByColumn: Record<string, Task[]> = {}

  for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
    nextByColumn[columnId] = columnTasks.filter((task) => task.id !== activeId)
  }

  const targetTasks = [...(nextByColumn[overColumnId] ?? [])]
  targetTasks.splice(overIndex, 0, {
    ...activeTask,
    column_id: overColumnId,
  })
  nextByColumn[overColumnId] = targetTasks

  const affectedColumns =
    sourceColumnId === overColumnId
      ? [overColumnId]
      : [sourceColumnId, overColumnId]

  const updates: TaskMoveUpdate[] = []

  for (const columnId of affectedColumns) {
    const columnTasks = nextByColumn[columnId] ?? []
    columnTasks.forEach((task, index) => {
      if (task.column_id !== columnId || task.position !== index) {
        updates.push({
          id: task.id,
          column_id: columnId,
          position: index,
        })
      }
    })
  }

  return updates
}

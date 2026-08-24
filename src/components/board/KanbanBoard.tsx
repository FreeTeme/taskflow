import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Column, Task } from '../../types/database'
import {
  buildMoveUpdates,
  groupTasksByColumn,
} from '../../hooks/useTasks'
import { ColumnList } from './ColumnList'
import { TaskCardPreview } from './TaskCardPreview'

interface KanbanBoardProps {
  columns: Column[]
  tasks: Task[]
  onAddColumn: (title: string) => Promise<void>
  onRenameColumn: (columnId: string, title: string) => Promise<void>
  onDeleteColumn: (columnId: string) => Promise<void>
  onAddTask: (columnId: string, title: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onMoveTask: (
    updates: { id: string; column_id: string; position: number }[],
  ) => Promise<void>
  onTaskClick?: (task: Task) => void
}

function sortTasksByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.position - b.position)
}

function cloneTasksByColumn(
  tasksByColumn: Record<string, Task[]>,
): Record<string, Task[]> {
  return Object.fromEntries(
    Object.entries(tasksByColumn).map(([columnId, columnTasks]) => [
      columnId,
      [...columnTasks],
    ]),
  )
}

export function KanbanBoard({
  columns,
  tasks,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onTaskClick,
}: KanbanBoardProps) {
  const columnIds = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position).map((c) => c.id),
    [columns],
  )

  const serverTasksByColumn = useMemo(() => {
    const grouped = groupTasksByColumn(tasks)
    for (const columnId of columnIds) {
      grouped[columnId] = sortTasksByPosition(grouped[columnId] ?? [])
    }
    return grouped
  }, [tasks, columnIds])

  const [tasksByColumn, setTasksByColumn] = useState(serverTasksByColumn)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!activeTask) {
      setTasksByColumn(serverTasksByColumn)
    }
  }, [serverTasksByColumn, activeTask])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const findContainer = (id: string): string | undefined => {
    if (columnIds.includes(id)) return id
    return columnIds.find((columnId) =>
      tasksByColumn[columnId]?.some((task) => task.id === id),
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((item) => item.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeContainer = findContainer(activeId)
    const overContainer =
      findContainer(overId) ??
      (columnIds.includes(overId) ? overId : undefined)

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

    setTasksByColumn((previous) => {
      const activeItems = previous[activeContainer] ?? []
      const overItems = previous[overContainer] ?? []
      const activeIndex = activeItems.findIndex((task) => task.id === activeId)
      if (activeIndex === -1) return previous

      const movedTask = activeItems[activeIndex]
      if (!movedTask) return previous

      const overIndex = columnIds.includes(overId)
        ? overItems.length
        : overItems.findIndex((task) => task.id === overId)

      const nextActiveItems = activeItems.filter((task) => task.id !== activeId)
      const nextOverItems = [...overItems]
      nextOverItems.splice(
        overIndex >= 0 ? overIndex : nextOverItems.length,
        0,
        { ...movedTask, column_id: overContainer },
      )

      return {
        ...previous,
        [activeContainer]: nextActiveItems,
        [overContainer]: nextOverItems,
      }
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const activeContainer = findContainer(activeId)
    const overContainer =
      findContainer(overId) ??
      (columnIds.includes(overId) ? overId : undefined)

    if (!activeContainer || !overContainer) return

    let nextTasksByColumn = cloneTasksByColumn(tasksByColumn)

    if (activeContainer === overContainer) {
      const columnTasks = nextTasksByColumn[activeContainer] ?? []
      const activeIndex = columnTasks.findIndex((task) => task.id === activeId)
      const overIndex = columnIds.includes(overId)
        ? columnTasks.length - 1
        : columnTasks.findIndex((task) => task.id === overId)

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        nextTasksByColumn[activeContainer] = arrayMove(
          columnTasks,
          activeIndex,
          overIndex,
        )
      }
    }

    nextTasksByColumn = Object.fromEntries(
      Object.entries(nextTasksByColumn).map(([columnId, columnTasks]) => [
        columnId,
        columnTasks.map((task, index) => ({
          ...task,
          column_id: columnId,
          position: index,
        })),
      ]),
    )

    setTasksByColumn(nextTasksByColumn)

    const overIndex = (nextTasksByColumn[overContainer] ?? []).findIndex(
      (task) => task.id === activeId,
    )

    if (overIndex === -1) return

    const updates = buildMoveUpdates(
      serverTasksByColumn,
      activeId,
      overContainer,
      overIndex,
    )

    if (updates.length > 0) {
      await onMoveTask(updates)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <ColumnList
        columns={columns}
        tasksByColumn={tasksByColumn}
        onRenameColumn={onRenameColumn}
        onDeleteColumn={onDeleteColumn}
        onAddColumn={onAddColumn}
        onAddTask={onAddTask}
        onDeleteTask={onDeleteTask}
        onTaskClick={onTaskClick}
      />

      <DragOverlay>
        {activeTask ? <TaskCardPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

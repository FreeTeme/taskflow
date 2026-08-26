import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useBoardHotkeys } from '../../hooks/useBoardHotkeys'
import { useMembers } from '../../hooks/useMembers'
import {
  useRealtimeBoard,
  type ActivityEvent,
} from '../../hooks/useRealtimeBoard'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import type { Column, Task } from '../../types/database'
import { ThemeToggle } from '../../providers/ThemeProvider'
import { TaskFilters } from '../task/TaskFilters'
import { TaskModal } from '../task/TaskModal'
import { TaskSearch } from '../task/TaskSearch'
import { ActivityLog } from './ActivityLog'
import { BoardMembersModal } from './BoardMembersModal'

interface BoardPageFeaturesProps {
  boardId: string
  ownerId: string
  tasks: Task[]
  columns: Column[]
  firstColumnId?: string
  onCreateTask: (columnId: string) => void | Promise<void>
  onMoveTask: (taskId: string, targetColumnId: string) => Promise<void>
  children: (
    filteredTasks: Task[],
    openTask: (task: Task) => void,
    allTasks: Task[],
  ) => ReactNode
}

export function useTaskModalSelection() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const openTask = useCallback((task: Task) => {
    setSelectedTaskId(task.id)
  }, [])

  const closeTask = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  return { selectedTaskId, openTask, closeTask }
}

export function BoardPageFeatures({
  boardId,
  ownerId,
  tasks,
  columns,
  firstColumnId,
  onCreateTask,
  onMoveTask,
  children,
}: BoardPageFeaturesProps) {
  const { selectedTaskId, openTask, closeTask } = useTaskModalSelection()
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])
  const [membersOpen, setMembersOpen] = useState(false)

  const { members } = useMembers(boardId)
  const {
    filters,
    filteredTasks,
    setPriority,
    setAssigneeId,
    setDueDate,
    setSearch,
    resetFilters,
  } = useTaskFilters(tasks)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  useEffect(() => {
    if (selectedTaskId && !selectedTask) closeTask()
  }, [selectedTaskId, selectedTask, closeTask])

  const handleActivity = useCallback((event: ActivityEvent) => {
    setActivityEvents((current) => [event, ...current].slice(0, 50))
  }, [])

  useRealtimeBoard(boardId, { onActivity: handleActivity })

  useBoardHotkeys({
    onNewTask: firstColumnId
      ? () => {
          void onCreateTask(firstColumnId)
        }
      : undefined,
    onCloseModal: closeTask,
    modalOpen: !!selectedTaskId,
  })

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px] flex-1">
            <TaskSearch value={filters.search} onChange={setSearch} />
          </div>
          <TaskFilters
            filters={filters}
            members={members}
            onPriorityChange={setPriority}
            onAssigneeChange={setAssigneeId}
            onDueDateChange={setDueDate}
            onReset={resetFilters}
          />
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="h-9 rounded-lg border border-border px-3 text-sm text-text transition-colors hover:bg-surface-muted"
          >
            Members
          </button>
          <ThemeToggle />
        </div>

        <ActivityLog
          events={activityEvents}
          onClear={() => setActivityEvents([])}
        />
      </div>

      {children(filteredTasks, openTask, tasks)}

      <TaskModal
        task={selectedTask}
        boardId={boardId}
        columns={columns}
        onMoveTask={onMoveTask}
        open={!!selectedTaskId && !!selectedTask}
        onClose={closeTask}
      />

      <BoardMembersModal
        boardId={boardId}
        ownerId={ownerId}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
      />
    </>
  )
}

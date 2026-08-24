import { useCallback, useState, type ReactNode } from 'react'
import { useBoardHotkeys } from '../../hooks/useBoardHotkeys'
import { useMembers } from '../../hooks/useMembers'
import {
  useRealtimeBoard,
  type ActivityEvent,
} from '../../hooks/useRealtimeBoard'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import type { Task } from '../../types/database'
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
  firstColumnId?: string
  onCreateTask: (columnId: string) => void | Promise<void>
  children: (filteredTasks: Task[], openTask: (task: Task) => void) => ReactNode
}

export function useTaskModalSelection() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const openTask = useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])

  const closeTask = useCallback(() => {
    setSelectedTask(null)
  }, [])

  return { selectedTask, openTask, closeTask }
}

export function BoardPageFeatures({
  boardId,
  ownerId,
  tasks,
  firstColumnId,
  onCreateTask,
  children,
}: BoardPageFeaturesProps) {
  const { selectedTask, openTask, closeTask } = useTaskModalSelection()
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
    modalOpen: !!selectedTask,
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

      {children(filteredTasks, openTask)}

      <TaskModal
        task={selectedTask}
        boardId={boardId}
        open={!!selectedTask}
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

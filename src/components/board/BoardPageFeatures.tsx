import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Funnel, Plus, UsersThree, X } from '@phosphor-icons/react'
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

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
  const activeFilterCount = [
    filters.priority !== 'all',
    filters.assigneeId !== 'all',
    filters.dueDate !== 'all',
  ].filter(Boolean).length

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
      <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">Board tools</p>
              <p className="mt-1 text-xs text-text-muted">Search and narrow the work in view.</p>
            </div>
            <button
              type="button"
              disabled={!firstColumnId}
              onClick={() => firstColumnId && void onCreateTask(firstColumnId)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.96]"
            >
              <Plus aria-hidden="true" size={17} weight="bold" />
              <span>New task</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 lg:max-w-sm">
            <TaskSearch value={filters.search} onChange={setSearch} />
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((current) => !current)}
              aria-expanded={mobileFiltersOpen}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text shadow-sm transition-[background-color,border-color,transform] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96] lg:hidden"
            >
              {mobileFiltersOpen ? <X aria-hidden="true" size={17} /> : <Funnel aria-hidden="true" size={17} />}
              Filters
              {activeFilterCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="hidden lg:block">
              <TaskFilters
                filters={filters}
                members={members}
                onPriorityChange={setPriority}
                onAssigneeChange={setAssigneeId}
                onDueDateChange={setDueDate}
                onReset={resetFilters}
              />
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              <button
                type="button"
                onClick={() => setMembersOpen(true)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text shadow-sm transition-[background-color,border-color,transform] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96] lg:flex-none"
              >
                <UsersThree aria-hidden="true" size={18} />
                Members
              </button>
              <ThemeToggle />
            </div>
          </div>

          {mobileFiltersOpen ? (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4 shadow-sm lg:hidden">
              <TaskFilters
                filters={filters}
                members={members}
                onPriorityChange={setPriority}
                onAssigneeChange={setAssigneeId}
                onDueDateChange={setDueDate}
                onReset={resetFilters}
              />
            </div>
          ) : null}
        </div>
      </div>

      {children(filteredTasks, openTask, tasks)}

      <div className="px-4 pb-8 pt-3 sm:px-6 sm:pb-10">
        <div className="mx-auto max-w-[1600px]">
          <ActivityLog
            events={activityEvents}
            onClear={() => setActivityEvents([])}
          />
        </div>
      </div>

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

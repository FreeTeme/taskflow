import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BoardHeader } from '../components/board/BoardHeader'
import { BoardPageFeatures } from '../components/board/BoardPageFeatures'
import { KanbanBoard } from '../components/board/KanbanBoard'
import { KanbanSkeleton } from '../components/ui/Skeleton'
import { Toast } from '../components/ui/Toast'
import { useBoard } from '../hooks/useBoard'
import { useColumns } from '../hooks/useColumns'
import { buildMoveUpdates, groupTasksByColumn, useTasks } from '../hooks/useTasks'
import { ConfirmDialog } from '../components/shared/Modal'
import { useAuth } from '../providers/AuthProvider'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function BoardPage() {
  const { user } = useAuth()
  const { boardId } = useParams<{ boardId: string }>()
  const boardQuery = useBoard(boardId)
  const columnsHook = useColumns(boardId)
  const tasksHook = useTasks(boardId)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ type: 'column' | 'task'; id: string } | null>(null)

  const isLoading =
    boardQuery.isLoading || columnsHook.isLoading || tasksHook.isLoading

  const isError =
    boardQuery.isError || columnsHook.isError || tasksHook.isError

  const error =
    boardQuery.error ?? columnsHook.error ?? tasksHook.error ?? null

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      await action()
    } catch (actionError) {
      setToastMessage(getErrorMessage(actionError))
    }
  }

  const sortedColumns = [...columnsHook.columns].sort(
    (a, b) => a.position - b.position,
  )
  const firstColumnId = sortedColumns[0]?.id
  const canManageColumns = user?.id === boardQuery.data?.owner_id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
          <div className="mx-auto h-8 max-w-[1600px] motion-safe:animate-pulse rounded bg-border/60" />
        </div>
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <KanbanSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !boardQuery.data || !boardId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-surface px-6 py-8 text-center">
          <h1 className="mb-2 text-lg font-semibold text-text">Unable to load board</h1>
          <p className="text-sm text-text-muted">
            {error ? getErrorMessage(error) : 'Board not found.'}
          </p>
          <Link to="/" className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Back to boards
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <a href="#main-content" className="skip-link">Skip to board</a>
      <BoardHeader board={boardQuery.data} />

      <main id="main-content" className="mx-auto max-w-[1600px]">
        <BoardPageFeatures
          boardId={boardId}
          ownerId={boardQuery.data.owner_id}
          tasks={tasksHook.tasks}
          columns={columnsHook.columns}
          firstColumnId={firstColumnId}
          onMoveTask={async (taskId, targetColumnId) => {
            const grouped = groupTasksByColumn(tasksHook.tasks)
            const targetIndex = grouped[targetColumnId]?.length ?? 0
            const updates = buildMoveUpdates(grouped, taskId, targetColumnId, targetIndex)
            await tasksHook.moveTask(updates)
          }}
          onCreateTask={(columnId) =>
            runAction(async () => {
              const columnTasks = tasksHook.tasks.filter(
                (task) => task.column_id === columnId,
              )
              await tasksHook.createTask({
                columnId,
                title: 'New task',
                position: columnTasks.length,
              })
            })
          }
        >
          {(filteredTasks, openTask, allTasks) => (
            <KanbanBoard
              columns={columnsHook.columns}
              tasks={allTasks}
              visibleTasks={filteredTasks}
              canManageColumns={canManageColumns}
              onAddColumn={(title) =>
                runAction(() =>
                  columnsHook.createColumn({
                    title,
                    position: columnsHook.columns.length,
                  }),
                )
              }
              onRenameColumn={(columnId, title) =>
                runAction(() =>
                  columnsHook.updateColumn({ columnId, updates: { title } }),
                )
              }
              onDeleteColumn={(columnId) =>
                setPendingDelete({ type: 'column', id: columnId })
              }
              onAddTask={(columnId, title) =>
                runAction(async () => {
                  const columnTasks = tasksHook.tasks.filter(
                    (task) => task.column_id === columnId,
                  )
                  await tasksHook.createTask({
                    columnId,
                    title,
                    position: columnTasks.length,
                  })
                })
              }
              onDeleteTask={(taskId) =>
                setPendingDelete({ type: 'task', id: taskId })
              }
              onMoveTask={(updates) =>
                runAction(() => tasksHook.moveTask(updates))
              }
              onTaskClick={openTask}
            />
          )}
        </BoardPageFeatures>
      </main>

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.type === 'column' ? 'Delete column?' : 'Delete task?'}
        description={pendingDelete?.type === 'column' ? 'This column and every task in it will be permanently deleted.' : 'This task and its comments will be permanently deleted.'}
        confirmLabel={pendingDelete?.type === 'column' ? 'Delete column' : 'Delete task'}
        destructive
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete
          if (!target) return
          setPendingDelete(null)
          void runAction(() => target.type === 'column' ? columnsHook.deleteColumn(target.id) : tasksHook.deleteTask(target.id))
        }}
      />
    </div>
  )
}

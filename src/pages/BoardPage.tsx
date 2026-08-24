import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BoardHeader } from '../components/board/BoardHeader'
import { BoardPageFeatures } from '../components/board/BoardPageFeatures'
import { KanbanBoard } from '../components/board/KanbanBoard'
import { KanbanSkeleton } from '../components/ui/Skeleton'
import { Toast } from '../components/ui/Toast'
import { useBoard } from '../hooks/useBoard'
import { useColumns } from '../hooks/useColumns'
import { useTasks } from '../hooks/useTasks'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const boardQuery = useBoard(boardId)
  const columnsHook = useColumns(boardId)
  const tasksHook = useTasks(boardId)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
          <div className="mx-auto h-8 max-w-[1600px] animate-pulse rounded bg-border/60" />
        </div>
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <KanbanSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !boardQuery.data || !boardId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
        <div className="max-w-md rounded-xl border border-danger/30 bg-surface px-6 py-8 text-center">
          <h1 className="mb-2 text-lg font-semibold text-text">Unable to load board</h1>
          <p className="text-sm text-text-muted">
            {error ? getErrorMessage(error) : 'Board not found.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <BoardHeader board={boardQuery.data} />

      <main className="mx-auto max-w-[1600px]">
        <BoardPageFeatures
          boardId={boardId}
          ownerId={boardQuery.data.owner_id}
          tasks={tasksHook.tasks}
          firstColumnId={firstColumnId}
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
          {(filteredTasks, openTask) => (
            <KanbanBoard
              columns={columnsHook.columns}
              tasks={filteredTasks}
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
                runAction(() => columnsHook.deleteColumn(columnId))
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
                runAction(() => tasksHook.deleteTask(taskId))
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
    </div>
  )
}

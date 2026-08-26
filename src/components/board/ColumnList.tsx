import { useState, type FormEvent } from 'react'
import { Plus } from '@phosphor-icons/react'
import type { Column as ColumnType, Task } from '../../types/database'
import { Column } from './Column'

interface ColumnListProps {
  columns: ColumnType[]
  tasksByColumn: Record<string, Task[]>
  canManageColumns: boolean
  onRenameColumn: (columnId: string, title: string) => Promise<void>
  onDeleteColumn: (columnId: string) => void | Promise<void>
  onAddColumn: (title: string) => Promise<void>
  onAddTask: (columnId: string, title: string) => Promise<void>
  onDeleteTask: (taskId: string) => void | Promise<void>
  onTaskClick?: (task: Task) => void
}

export function ColumnList({
  columns,
  tasksByColumn,
  canManageColumns,
  onRenameColumn,
  onDeleteColumn,
  onAddColumn,
  onAddTask,
  onDeleteTask,
  onTaskClick,
}: ColumnListProps) {
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)
  const [selectedMobileColumnId, setSelectedMobileColumnId] = useState(
    sortedColumns[0]?.id ?? '',
  )
  const activeMobileColumnId = sortedColumns.some(
    (column) => column.id === selectedMobileColumnId,
  )
    ? selectedMobileColumnId
    : (sortedColumns[0]?.id ?? '')

  const handleAddColumn = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = newColumnTitle.trim()
    if (!trimmed) return

    setIsAddingColumn(true)
    try {
      await onAddColumn(trimmed)
      setNewColumnTitle('')
    } finally {
      setIsAddingColumn(false)
    }
  }

  return (
    <div className="pb-4">
      <div className="mb-4 px-4 sm:px-6 md:hidden">
        <div className="mx-auto flex max-w-[1600px] overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-sm">
          {sortedColumns.map((column) => {
            const isActive = column.id === activeMobileColumnId

            return (
              <button
                key={column.id}
                type="button"
                onClick={() => setSelectedMobileColumnId(column.id)}
                aria-pressed={isActive}
                className={`relative min-h-11 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:active:scale-[0.96] ${
                  isActive
                    ? 'bg-primary/8 text-primary shadow-sm'
                    : 'text-text-muted hover:bg-surface-muted hover:text-text'
                }`}
              >
                {column.title}
                <span className="ml-2 tabular-nums text-xs opacity-70">
                  {tasksByColumn[column.id]?.length ?? 0}
                </span>
                {isActive ? (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="mx-auto flex max-w-[1600px] gap-4 px-4 sm:px-6">
          {sortedColumns.map((column) => (
          <Column
            key={column.id}
            className={column.id === activeMobileColumnId ? 'flex' : 'hidden md:flex'}
            column={column}
            tasks={tasksByColumn[column.id] ?? []}
            canManageColumns={canManageColumns}
            onRename={onRenameColumn}
            onDelete={onDeleteColumn}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onTaskClick={onTaskClick}
          />
          ))}

          {canManageColumns ? <section className="hidden w-80 shrink-0 flex-col rounded-xl border border-dashed border-border bg-surface/50 p-4 md:flex">
          <h2 className="mb-3 text-sm font-semibold text-text">Add column</h2>
          <form onSubmit={(event) => void handleAddColumn(event)}>
            <input
              value={newColumnTitle}
              onChange={(event) => setNewColumnTitle(event.target.value)}
              placeholder="Column name"
              disabled={isAddingColumn}
              className="mb-2 h-10 w-full rounded-lg border border-border bg-surface px-3 text-base outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:text-sm"
            />
            <button
              type="submit"
              disabled={isAddingColumn || !newColumnTitle.trim()}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.96]"
            >
              <Plus aria-hidden="true" size={16} weight="bold" />
              {isAddingColumn ? 'Adding...' : 'Add column'}
            </button>
          </form>
          </section> : null}
        </div>
      </div>
    </div>
  )
}

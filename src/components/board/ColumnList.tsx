import { useState, type FormEvent } from 'react'
import type { Column as ColumnType, Task } from '../../types/database'
import { Column } from './Column'

interface ColumnListProps {
  columns: ColumnType[]
  tasksByColumn: Record<string, Task[]>
  onRenameColumn: (columnId: string, title: string) => Promise<void>
  onDeleteColumn: (columnId: string) => Promise<void>
  onAddColumn: (title: string) => Promise<void>
  onAddTask: (columnId: string, title: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onTaskClick?: (task: Task) => void
}

export function ColumnList({
  columns,
  tasksByColumn,
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
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4 px-4 sm:px-6">
        {sortedColumns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] ?? []}
            onRename={onRenameColumn}
            onDelete={onDeleteColumn}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onTaskClick={onTaskClick}
          />
        ))}

        <section className="flex w-72 shrink-0 flex-col rounded-xl border border-dashed border-border bg-surface/50 p-3">
          <h2 className="mb-3 text-sm font-semibold text-text">Add column</h2>
          <form onSubmit={(event) => void handleAddColumn(event)}>
            <input
              value={newColumnTitle}
              onChange={(event) => setNewColumnTitle(event.target.value)}
              placeholder="Column name"
              disabled={isAddingColumn}
              className="mb-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isAddingColumn || !newColumnTitle.trim()}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingColumn ? 'Adding...' : 'Add column'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

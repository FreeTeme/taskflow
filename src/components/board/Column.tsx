import { useState, type FormEvent } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DotsThree, Plus, Trash } from '@phosphor-icons/react'
import type { Column as ColumnType, Task } from '../../types/database'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  className?: string
  column: ColumnType
  tasks: Task[]
  canManageColumns: boolean
  onRename: (columnId: string, title: string) => Promise<void>
  onDelete: (columnId: string) => void | Promise<void>
  onAddTask: (columnId: string, title: string) => Promise<void>
  onDeleteTask: (taskId: string) => void | Promise<void>
  onTaskClick?: (task: Task) => void
}

export function Column({
  className = '',
  column,
  tasks,
  canManageColumns,
  onRename,
  onDelete,
  onAddTask,
  onDeleteTask,
  onTaskClick,
}: ColumnProps) {
  const [title, setTitle] = useState(column.title)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
    },
  })

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)

  const handleRename = async () => {
    const trimmed = title.trim()
    if (!trimmed || trimmed === column.title) {
      setTitle(column.title)
      return
    }
    await onRename(column.id, trimmed)
  }

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return

    setIsAdding(true)
    try {
      await onAddTask(column.id, trimmed)
      setNewTaskTitle('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <section
      className={`${className} w-full shrink-0 flex-col rounded-xl border bg-surface-muted/60 md:w-80 ${
        isOver
          ? 'border-primary ring-2 ring-primary/15'
          : 'border-border'
      }`}
    >
      <div className="flex min-h-14 items-center gap-2 border-b border-border px-3.5 py-2">
        {canManageColumns ? <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void handleRename()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                setTitle(column.title)
                event.currentTarget.blur()
              }
            }}
            className="min-h-10 min-w-0 flex-1 rounded-md bg-transparent px-1 text-base font-semibold tracking-[-0.01em] text-text outline-none focus:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
            aria-label="Column title"
          /> : <h2 className="min-w-0 flex-1 px-1 py-2 text-sm font-semibold text-text">{column.title}</h2>}
        <span className="grid size-6 place-items-center rounded-full bg-surface text-xs font-medium tabular-nums text-text-muted shadow-sm">
          {sortedTasks.length}
        </span>
        {canManageColumns ? <button
          type="button"
          onClick={() => void onDelete(column.id)}
          className="grid size-10 place-items-center rounded-lg text-text-muted transition-[background-color,color,transform] hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 motion-safe:active:scale-[0.96]"
          aria-label={`Delete ${column.title}`}
        >
          <Trash aria-hidden="true" size={17} />
        </button> : null}
        {!canManageColumns ? <DotsThree aria-hidden="true" size={18} className="text-text-muted" /> : null}
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[18rem] flex-1 flex-col gap-2.5 p-3"
      >
        <SortableContext
          items={sortedTasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={(taskId) => void onDeleteTask(taskId)}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {sortedTasks.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-text-muted">
            Drop tasks here
          </p>
        )}
      </div>

      <form onSubmit={(event) => void handleAddTask(event)} className="flex gap-2 p-3 pt-1">
        <input
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
          placeholder="Add a task..."
          disabled={isAdding}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:text-sm"
        />
        <button
          type="submit"
          disabled={isAdding || !newTaskTitle.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.96]"
        >
          <Plus aria-hidden="true" size={17} weight="bold" />
          <span className="sr-only"> task to {column.title}</span>
        </button>
      </form>
    </section>
  )
}

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/database'

interface TaskCardProps {
  task: Task
  onDelete: (taskId: string) => void
  onTaskClick?: (task: Task) => void
}

export function TaskCard({ task, onDelete, onTaskClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      columnId: task.column_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-surface px-3 py-2 shadow-sm transition hover:border-primary/40 hover:shadow ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag task"
          className="mt-0.5 shrink-0 cursor-grab rounded px-1 text-text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={() => onTaskClick?.(task)}
          className="min-w-0 flex-1 text-left text-sm font-medium text-text hover:text-primary"
        >
          {task.title}
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded px-1 text-xs text-text-muted opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

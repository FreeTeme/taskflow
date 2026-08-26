import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskWithAssignee } from '../../types/database'
import { Avatar } from '../shared/Avatar'

interface TaskCardProps {
  task: TaskWithAssignee
  onDelete: (taskId: string) => void
  onTaskClick?: (task: Task) => void
}

export function TaskCard({ task, onDelete, onTaskClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
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
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-no-dnd]')) return
        listeners?.onPointerDown?.(event)
      }}
      className={`group cursor-grab rounded-lg border border-border bg-surface px-3 py-2 shadow-sm transition-[border-color,box-shadow,opacity] hover:border-primary/40 hover:shadow active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Move ${task.title}`}
          className="mt-0.5 min-h-6 min-w-6 shrink-0 cursor-grab rounded px-1 text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:cursor-grabbing"
          {...attributes}
          onKeyDown={(event) => listeners?.onKeyDown?.(event)}
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={() => onTaskClick?.(task)}
          className="min-w-0 flex-1 rounded text-left text-sm font-medium text-text outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {task.title}
        </button>
        <button
          type="button"
          data-no-dnd
          onClick={() => onDelete(task.id)}
          className="rounded px-1 text-xs text-text-muted opacity-0 outline-none transition-[color,background-color,opacity] hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-danger group-focus-within:opacity-100 group-hover:opacity-100"
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
      {task.assignee ? (
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Avatar
            name={task.assignee.name}
            src={task.assignee.avatar_url}
            size="sm"
          />
          <span className="truncate text-xs text-text-muted">
            {task.assignee.name ?? 'Assigned member'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

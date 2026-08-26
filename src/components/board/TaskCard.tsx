import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarBlank, DotsSixVertical, Trash } from '@phosphor-icons/react'
import type { Task, TaskWithAssignee } from '../../types/database'
import { Avatar } from '../shared/Avatar'

interface TaskCardProps {
  task: TaskWithAssignee
  onDelete: (taskId: string) => void
  onTaskClick?: (task: Task) => void
}

const priorityStyles = {
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  high: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
  }).format(new Date(`${value}T00:00:00`))
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
      className={`group cursor-grab rounded-lg border border-border bg-surface p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow,opacity,transform] hover:border-zinc-300 hover:shadow-[0_6px_16px_rgb(0_0_0/0.06)] active:cursor-grabbing dark:hover:border-zinc-600 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Move ${task.title}`}
          className="mt-0.5 grid size-7 shrink-0 cursor-grab select-none place-items-center rounded-md text-text-muted outline-none transition-[background-color,color,transform] hover:bg-surface-muted hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:cursor-grabbing motion-safe:active:scale-[0.96]"
          {...attributes}
          onKeyDown={(event) => listeners?.onKeyDown?.(event)}
        >
          <DotsSixVertical aria-hidden="true" size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => onTaskClick?.(task)}
          className="min-w-0 flex-1 rounded text-left text-sm font-medium leading-[1.4] text-text outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {task.title}
        </button>
        <button
          type="button"
          data-no-dnd
          onClick={() => onDelete(task.id)}
          className="grid size-7 shrink-0 place-items-center rounded-md text-text-muted opacity-0 outline-none transition-[color,background-color,opacity,transform] hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-danger group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:active:scale-[0.96]"
          aria-label={`Delete ${task.title}`}
        >
          <Trash aria-hidden="true" size={15} />
        </button>
      </div>

      <div className="mt-3 flex min-h-7 items-center gap-2 pl-9">
        <span className={`rounded-md px-2 py-1 text-xs font-medium capitalize ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_date ? (
          <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-text-muted">
            <CalendarBlank aria-hidden="true" size={15} />
            {formatDueDate(task.due_date)}
          </span>
        ) : null}
        {task.assignee ? (
          <span className="ml-auto" title={task.assignee.name ?? 'Assigned member'}>
          <Avatar
            name={task.assignee.name}
            src={task.assignee.avatar_url}
            size="sm"
          />
          </span>
        ) : null}
      </div>
    </div>
  )
}
